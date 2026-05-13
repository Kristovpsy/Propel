// supabase/functions/match-mentors/index.ts
// Deno-based Supabase Edge Function — Mentor-Mentee Matching Algorithm
//
// Scoring weights:
//   Skills match       — 40%
//   Aspiration match   — 30%
//   Average rating     — 20%
//   Responsiveness     — 10%
//   Availability       — required gate (excluded if at capacity)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ---------- CORS helpers ----------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Types ----------
interface WorkHistoryEntry {
  role: string;
  company: string;
  years: number;
}

interface MentorRow {
  user_id: string;
  bio: string;
  expertise_tags: string[];
  work_history: WorkHistoryEntry[];
  mentorship_style: string;
  max_capacity: number;
  current_count: number;
  is_at_capacity: boolean;
  response_rate: number;
  acceptance_ratio: number;
  area_of_mentorship: string;
  years_of_experience: number;
  portfolio: string | null;
}

interface MenteeRow {
  user_id: string;
  aspirations: string;
  learning_goals: string[];
  desired_skills: string[];
}

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface MatchBreakdown {
  skills_score: number;
  aspirations_score: number;
  rating_score: number;
  responsiveness_score: number;
}

interface MatchResult {
  mentor_id: string;
  total_score: number;
  breakdown: MatchBreakdown;
  mentor_profile: MentorRow;
  profile: ProfileRow;
  avg_rating: number;
  review_count: number;
}

// ---------- Utility: tokenize a string into lowercase words ----------
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2) // drop tiny words like "a", "to"
  );
}

// ---------- Scoring Functions ----------

/**
 * Skills match (40%)
 * Jaccard-like: |intersection| / |mentee desired skills|
 */
function scoreSkills(
  menteeSkills: string[],
  mentorTags: string[]
): number {
  if (menteeSkills.length === 0) return 0;

  const menteeSet = new Set(menteeSkills.map((s) => s.toLowerCase().trim()));
  const mentorSet = new Set(mentorTags.map((t) => t.toLowerCase().trim()));

  let matches = 0;
  for (const skill of menteeSet) {
    // Exact match or substring containment for flexibility
    for (const tag of mentorSet) {
      if (tag === skill || tag.includes(skill) || skill.includes(tag)) {
        matches++;
        break;
      }
    }
  }

  return matches / menteeSet.size;
}

/**
 * Aspiration/domain match (30%)
 * Tokenize mentee aspirations text, match against mentor work_history
 * role AND company fields.
 */
function scoreAspirations(
  menteeAspirations: string,
  mentorWorkHistory: WorkHistoryEntry[]
): number {
  if (!menteeAspirations || menteeAspirations.trim().length === 0) return 0;
  if (!mentorWorkHistory || mentorWorkHistory.length === 0) return 0;

  const aspirationTokens = tokenize(menteeAspirations);
  if (aspirationTokens.size === 0) return 0;

  // Build a set of all domain keywords from mentor work history (role + company)
  const domainTokens = new Set<string>();
  for (const entry of mentorWorkHistory) {
    for (const token of tokenize(entry.role || "")) domainTokens.add(token);
    for (const token of tokenize(entry.company || "")) domainTokens.add(token);
  }

  if (domainTokens.size === 0) return 0;

  let matches = 0;
  for (const token of aspirationTokens) {
    if (domainTokens.has(token)) {
      matches++;
    }
  }

  return matches / aspirationTokens.size;
}

/**
 * Rating score (20%)
 * Normalized: avg_rating / 5
 */
function scoreRating(avgRating: number): number {
  return Math.min(1, Math.max(0, avgRating / 5));
}

/**
 * Responsiveness score (10%)
 * Combined: response_rate * 0.6 + acceptance_ratio * 0.4
 */
function scoreResponsiveness(
  responseRate: number,
  acceptanceRatio: number
): number {
  return responseRate * 0.6 + acceptanceRatio * 0.4;
}

// ---------- Main handler ----------
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mentee_id, limit = 10 } = await req.json();

    if (!mentee_id) {
      return new Response(
        JSON.stringify({ error: "mentee_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the mentee profile
    const { data: menteeProfile, error: menteeError } = await supabase
      .from("mentee_profiles")
      .select("user_id, aspirations, learning_goals, desired_skills")
      .eq("user_id", mentee_id)
      .single();

    if (menteeError || !menteeProfile) {
      return new Response(
        JSON.stringify({ error: "Mentee profile not found", details: menteeError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mentee = menteeProfile as MenteeRow;

    // 2. Get IDs of mentors already connected to this mentee (pending or active)
    const { data: existingConnections } = await supabase
      .from("connections")
      .select("mentor_id")
      .eq("mentee_id", mentee_id)
      .in("status", ["pending", "active"]);

    const excludedMentorIds = new Set(
      (existingConnections || []).map((c: { mentor_id: string }) => c.mentor_id)
    );

    // 3. Fetch all available mentor profiles (not at capacity)
    const { data: mentorProfiles, error: mentorsError } = await supabase
      .from("mentor_profiles")
      .select("*")
      .eq("is_at_capacity", false);

    if (mentorsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch mentors", details: mentorsError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out already-connected mentors
    const candidates = (mentorProfiles as MentorRow[]).filter(
      (m) => !excludedMentorIds.has(m.user_id)
    );

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], total_candidates: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch public profiles for all candidate mentors
    const candidateUserIds = candidates.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", candidateUserIds);

    const profileMap = new Map<string, ProfileRow>();
    (profiles || []).forEach((p: ProfileRow) => profileMap.set(p.id, p));

    // 5. Fetch ratings for all candidate mentors in batch
    const { data: allRatings } = await supabase
      .from("ratings")
      .select("reviewee_id, score")
      .in("reviewee_id", candidateUserIds);

    const ratingMap = new Map<string, { total: number; count: number }>();
    (allRatings || []).forEach((r: { reviewee_id: string; score: number }) => {
      const existing = ratingMap.get(r.reviewee_id) || { total: 0, count: 0 };
      existing.total += r.score;
      existing.count += 1;
      ratingMap.set(r.reviewee_id, existing);
    });

    // 6. Score every candidate
    const results: MatchResult[] = candidates.map((mentor) => {
      const skillsScore = scoreSkills(mentee.desired_skills, mentor.expertise_tags);
      const aspirationsScore = scoreAspirations(mentee.aspirations, mentor.work_history);

      const ratingData = ratingMap.get(mentor.user_id);
      const avgRating = ratingData ? ratingData.total / ratingData.count : 0;
      const reviewCount = ratingData ? ratingData.count : 0;
      const ratingScore = scoreRating(avgRating);

      const responsivenessScore = scoreResponsiveness(
        mentor.response_rate ?? 0,
        mentor.acceptance_ratio ?? 0
      );

      // Weighted total
      const totalScore =
        skillsScore * 0.4 +
        aspirationsScore * 0.3 +
        ratingScore * 0.2 +
        responsivenessScore * 0.1;

      return {
        mentor_id: mentor.user_id,
        total_score: Math.round(totalScore * 100) / 100, // 2 decimal places
        breakdown: {
          skills_score: Math.round(skillsScore * 100) / 100,
          aspirations_score: Math.round(aspirationsScore * 100) / 100,
          rating_score: Math.round(ratingScore * 100) / 100,
          responsiveness_score: Math.round(responsivenessScore * 100) / 100,
        },
        mentor_profile: mentor,
        profile: profileMap.get(mentor.user_id) || {
          id: mentor.user_id,
          full_name: "Unknown",
          avatar_url: null,
          email: "",
        },
        avg_rating: Math.round(avgRating * 10) / 10,
        review_count: reviewCount,
      };
    });

    // 7. Sort descending by total_score, return top N
    results.sort((a, b) => b.total_score - a.total_score);
    const topMatches = results.slice(0, limit);

    return new Response(
      JSON.stringify({
        matches: topMatches,
        total_candidates: candidates.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
