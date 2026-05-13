import { supabase } from './supabase';
import type {
  Profile,
  MentorProfile,
  MenteeProfile,
  Connection,
  Curriculum,
  CurriculumGoal,
  CurriculumMilestone,
  Rating,
} from '../types';

// ================================================================
// MENTOR DISCOVERY
// ================================================================

export interface MentorWithProfile extends Profile {
  mentor_profiles: MentorProfile[];
  avg_rating?: number;
  review_count?: number;
}

export interface MentorSearchFilters {
  search?: string;
  tags?: string[];
  availableOnly?: boolean;
}

export async function fetchMentors(filters: MentorSearchFilters = {}) {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      mentor_profiles!inner(*)
    `)
    .eq('role', 'mentor')
    .eq('onboarding_complete', true);

  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,mentor_profiles.bio.ilike.%${filters.search}%`
    );
  }

  if (filters.availableOnly) {
    query = query.eq('mentor_profiles.is_at_capacity', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Post-filter by tags (Supabase array overlap)
  let mentors = (data as MentorWithProfile[]) || [];

  if (filters.tags && filters.tags.length > 0) {
    mentors = mentors.filter((m) => {
      const mentorTags = m.mentor_profiles?.[0]?.expertise_tags || [];
      return filters.tags!.some((tag) =>
        mentorTags.some((mt) => mt.toLowerCase() === tag.toLowerCase())
      );
    });
  }

  // Fetch average ratings for all mentors in batch
  const mentorIds = mentors.map((m) => m.id);
  if (mentorIds.length > 0) {
    const { data: ratings } = await supabase
      .from('ratings')
      .select('reviewee_id, score')
      .in('reviewee_id', mentorIds);

    if (ratings) {
      const ratingMap = new Map<string, { total: number; count: number }>();
      ratings.forEach((r) => {
        const existing = ratingMap.get(r.reviewee_id) || { total: 0, count: 0 };
        existing.total += r.score;
        existing.count += 1;
        ratingMap.set(r.reviewee_id, existing);
      });
      mentors = mentors.map((m) => {
        const r = ratingMap.get(m.id);
        return {
          ...m,
          avg_rating: r ? r.total / r.count : 0,
          review_count: r ? r.count : 0,
        };
      });
    }
  }

  return mentors;
}

export async function fetchMentorById(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      mentor_profiles!inner(*)
    `)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Fetch ratings for this mentor
  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      *,
      reviewer:profiles!ratings_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  const avg_rating =
    ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

  return {
    ...(profile as MentorWithProfile),
    ratings: (ratings as (Rating & { reviewer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> })[]) || [],
    avg_rating,
    review_count: ratings?.length || 0,
  };
}

export interface MenteeWithProfile extends Profile {
  mentee_profiles: MenteeProfile[];
}

export async function fetchMenteeById(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      mentee_profiles!inner(*)
    `)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Fetch active connections count
  const { count: connectionCount } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .eq('mentee_id', userId)
    .eq('status', 'active');

  return {
    ...(profile as MenteeWithProfile),
    active_mentors: connectionCount || 0,
  };
}

// ================================================================
// SOPHISTICATED RECOMMENDATION ENGINE
// ================================================================

interface RecommendationScore {
  mentor: MentorWithProfile;
  score: number;
  breakdown: {
    tagOverlap: number;
    ratingScore: number;
    capacityBonus: number;
    recencyBonus: number;
  };
}

/**
 * Weighted scoring recommendation algorithm:
 * - Tag Overlap (50%): Jaccard-like similarity between mentee desired_skills and mentor expertise_tags
 * - Rating Score (25%): Normalized average mentor rating
 * - Capacity Bonus (15%): Mentors with more available slots score higher
 * - Recency Bonus (10%): Newer mentors get a time-decay boost to ensure visibility
 */
export async function fetchRecommendedMentors(
  menteeProfile: MenteeProfile,
  excludeMentorIds: string[] = [],
  limit: number = 6
): Promise<MentorWithProfile[]> {
  const allMentors = await fetchMentors({ availableOnly: true });

  // Exclude already-connected mentors
  const candidates = allMentors.filter(
    (m) => !excludeMentorIds.includes(m.id)
  );

  if (candidates.length === 0) return [];

  const menteeSkills = new Set(
    menteeProfile.desired_skills.map((s) => s.toLowerCase())
  );
  const menteeGoals = new Set(
    menteeProfile.learning_goals.map((g) => g.toLowerCase())
  );

  // Combine mentee interests for broader matching
  const menteeInterests = new Set([...menteeSkills, ...menteeGoals]);

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const scored: RecommendationScore[] = candidates.map((mentor) => {
    const mp = mentor.mentor_profiles?.[0];
    const mentorTags = new Set(
      (mp?.expertise_tags || []).map((t) => t.toLowerCase())
    );

    // 1. Tag Overlap (Jaccard-inspired): intersection / mentee interests
    const intersection = [...menteeInterests].filter((s) => mentorTags.has(s));
    const tagOverlap =
      menteeInterests.size > 0 ? intersection.length / menteeInterests.size : 0;

    // 2. Rating Score: normalized to 0-1 (5-star scale)
    const ratingScore = (mentor.avg_rating || 0) / 5;

    // 3. Capacity Bonus: ratio of remaining slots
    const maxCap = mp?.max_capacity || 5;
    const currentCount = mp?.current_count || 0;
    const remainingRatio = (maxCap - currentCount) / maxCap;
    const capacityBonus = Math.max(0, Math.min(1, remainingRatio));

    // 4. Recency Bonus: exponential decay over 30 days
    const createdAt = new Date(mentor.created_at).getTime();
    const age = now - createdAt;
    const recencyBonus = Math.max(0, 1 - age / (THIRTY_DAYS_MS * 6));

    // Weighted total
    const score =
      tagOverlap * 0.5 +
      ratingScore * 0.25 +
      capacityBonus * 0.15 +
      recencyBonus * 0.1;

    return {
      mentor,
      score,
      breakdown: { tagOverlap, ratingScore, capacityBonus, recencyBonus },
    };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.mentor);
}

// ================================================================
// SERVER-SIDE MATCHING (Edge Function)
// ================================================================

import type { MatchResult } from '../types';

/**
 * Invoke the match-mentors Edge Function for server-side,
 * weighted algorithmic matching. Falls back to the client-side
 * fetchRecommendedMentors if the edge function is unavailable.
 */
export async function fetchMatchedMentors(
  menteeId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  const { data, error } = await supabase.functions.invoke('match-mentors', {
    body: { mentee_id: menteeId, limit },
  });

  if (error) throw error;
  return (data?.matches as MatchResult[]) || [];
}

// ================================================================
// CONNECTIONS
// ================================================================

export async function fetchConnections(userId: string, role: 'mentor' | 'mentee') {
  const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      mentor:profiles!connections_mentor_id_fkey(
        id, full_name, avatar_url, email,
        mentor_profiles(*)
      ),
      mentee:profiles!connections_mentee_id_fkey(
        id, full_name, avatar_url, email,
        mentee_profiles(*)
      )
    `)
    .eq(column, userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as Connection[]) || [];
}

export async function fetchConnectionStatus(mentorId: string, menteeId: string) {
  const { data, error } = await supabase
    .from('connections')
    .select('id, status')
    .eq('mentor_id', mentorId)
    .eq('mentee_id', menteeId)
    .in('status', ['pending', 'active'])
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function sendConnectionRequest(
  mentorId: string,
  menteeId: string,
  requestMessage: string
) {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      mentor_id: mentorId,
      mentee_id: menteeId,
      status: 'pending',
      request_message: requestMessage,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConnectionStatus(
  connectionId: string,
  status: 'active' | 'rejected' | 'ended'
) {
  const { data, error } = await supabase
    .from('connections')
    .update({ status })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ================================================================
// CURRICULA
// ================================================================

export async function fetchCurriculum(connectionId: string) {
  const { data, error } = await supabase
    .from('curricula')
    .select('*')
    .eq('connection_id', connectionId)
    .maybeSingle();

  if (error) throw error;
  return data as Curriculum | null;
}

export async function createCurriculum(connectionId: string) {
  const { data, error } = await supabase
    .from('curricula')
    .insert({
      connection_id: connectionId,
      goals: [],
      milestones: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function addGoalToCurriculum(
  curriculumId: string,
  currentGoals: CurriculumGoal[],
  newGoal: Omit<CurriculumGoal, 'id'>
) {
  const goal: CurriculumGoal = {
    ...newGoal,
    id: crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from('curricula')
    .update({ goals: [...currentGoals, goal] })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function updateGoalStatus(
  curriculumId: string,
  goals: CurriculumGoal[],
  goalId: string,
  status: CurriculumGoal['status']
) {
  const updated = goals.map((g) =>
    g.id === goalId ? { ...g, status } : g
  );

  const { data, error } = await supabase
    .from('curricula')
    .update({ goals: updated })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function addMilestone(
  curriculumId: string,
  currentMilestones: CurriculumMilestone[],
  goalId: string,
  title: string
) {
  const milestone: CurriculumMilestone = {
    id: crypto.randomUUID(),
    goal_id: goalId,
    title,
    completed: false,
  };

  const { data, error } = await supabase
    .from('curricula')
    .update({ milestones: [...currentMilestones, milestone] })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function toggleMilestone(
  curriculumId: string,
  milestones: CurriculumMilestone[],
  milestoneId: string
) {
  const updated = milestones.map((m) =>
    m.id === milestoneId ? { ...m, completed: !m.completed } : m
  );

  const { data, error } = await supabase
    .from('curricula')
    .update({ milestones: updated })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function deleteMilestone(
  curriculumId: string,
  milestones: CurriculumMilestone[],
  milestoneId: string
) {
  const updated = milestones.filter((m) => m.id !== milestoneId);

  const { data, error } = await supabase
    .from('curricula')
    .update({ milestones: updated })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

export async function deleteGoal(
  curriculumId: string,
  goals: CurriculumGoal[],
  milestones: CurriculumMilestone[],
  goalId: string
) {
  const updatedGoals = goals.filter((g) => g.id !== goalId);
  const updatedMilestones = milestones.filter((m) => m.goal_id !== goalId);

  const { data, error } = await supabase
    .from('curricula')
    .update({ goals: updatedGoals, milestones: updatedMilestones })
    .eq('id', curriculumId)
    .select()
    .single();

  if (error) throw error;
  return data as Curriculum;
}

// ================================================================
// DASHBOARD STATS
// ================================================================

export async function fetchMentorDashboardStats(userId: string) {
  const [connectionsRes, eventsRes] = await Promise.all([
    supabase
      .from('connections')
      .select('id, status')
      .eq('mentor_id', userId),
    supabase
      .from('events')
      .select('id')
      .eq('mentor_id', userId)
      .gte('event_date', new Date().toISOString()),
  ]);

  const connections = connectionsRes.data || [];
  const activeCount = connections.filter((c) => c.status === 'active').length;
  const pendingCount = connections.filter((c) => c.status === 'pending').length;
  const upcomingEvents = eventsRes.data?.length || 0;

  return { activeCount, pendingCount, upcomingEvents };
}

export async function fetchMenteeDashboardStats(userId: string) {
  // Fetch active connections
  const { data: connections } = await supabase
    .from('connections')
    .select('id, mentor_id, status')
    .eq('mentee_id', userId);

  const activeConnections = (connections || []).filter(
    (c) => c.status === 'active'
  );
  const activeConnectionIds = activeConnections.map((c) => c.id);

  // Fetch curricula for active connections
  let goalsInProgress = 0;
  let totalMilestones = 0;
  let completedMilestones = 0;

  if (activeConnectionIds.length > 0) {
    const { data: curricula } = await supabase
      .from('curricula')
      .select('goals, milestones')
      .in('connection_id', activeConnectionIds);

    if (curricula) {
      curricula.forEach((c) => {
        const goals = (c.goals as CurriculumGoal[]) || [];
        const milestones = (c.milestones as CurriculumMilestone[]) || [];
        goalsInProgress += goals.filter(
          (g) => g.status === 'in_progress'
        ).length;
        totalMilestones += milestones.length;
        completedMilestones += milestones.filter((m) => m.completed).length;
      });
    }
  }

  // Upcoming events for this mentee
  const mentorIds = activeConnections.map((c) => c.mentor_id);
  let upcomingSessions = 0;
  if (mentorIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .gte('event_date', new Date().toISOString())
      .or(
        mentorIds
          .map(
            (id) =>
              `and(mentor_id.eq.${id},or(invite_type.eq.group,invitee_id.eq.${userId}))`
          )
          .join(',')
      );
    upcomingSessions = events?.length || 0;
  }

  // Growth score: percentage of completed milestones
  const growthScore =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return {
    activeMentors: activeConnections.length,
    goalsInProgress,
    upcomingSessions,
    growthScore,
  };
}

// ================================================================
// REVIEWS
// ================================================================

export async function fetchReviews(mentorId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      reviewer:profiles!ratings_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('reviewee_id', mentorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as (Rating & {
    reviewer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  })[];
}

// ================================================================
// MESSAGING
// ================================================================

export async function fetchMessages(
  type: 'dm' | 'group',
  channelId: string,
  limit: number = 50
) {
  const column = type === 'dm' ? 'connection_id' : 'group_id';

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .eq(column, channelId)
    .eq('type', type)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function sendMessage(
  senderId: string,
  type: 'dm' | 'group',
  channelId: string,
  content: string
) {
  const payload: Record<string, unknown> = {
    sender_id: senderId,
    content,
    type,
  };
  if (type === 'dm') payload.connection_id = channelId;
  else payload.group_id = channelId;

  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchConversations(userId: string, role: 'mentor' | 'mentee') {
  // Fetch active DM connections
  const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
  const partnerCol = role === 'mentor' ? 'mentee' : 'mentor';

  const { data: connections } = await supabase
    .from('connections')
    .select(`
      id, status,
      mentor:profiles!connections_mentor_id_fkey(id, full_name, avatar_url),
      mentee:profiles!connections_mentee_id_fkey(id, full_name, avatar_url)
    `)
    .eq(column, userId)
    .eq('status', 'active');

  // Fetch groups the user is a member of or owns
  const { data: ownedGroups } = await supabase
    .from('groups')
    .select('id, name, mentor_id')
    .eq('mentor_id', userId);

  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, mentor_id)')
    .eq('user_id', userId);

  const conversations: {
    id: string;
    type: 'dm' | 'group';
    name: string;
    connectionId?: string;
    groupId?: string;
    partnerId?: string;
    partnerAvatar?: string | null;
  }[] = [];

  // DMs
  (connections || []).forEach((conn: any) => {
    const partner = conn[partnerCol];
    conversations.push({
      id: `dm-${conn.id}`,
      type: 'dm',
      name: partner?.full_name || 'Unknown',
      connectionId: conn.id,
      partnerId: partner?.id,
      partnerAvatar: partner?.avatar_url,
    });
  });

  // Groups
  const allGroups = [
    ...(ownedGroups || []),
    ...((memberGroups || []).map((m: any) => m.groups).filter(Boolean)),
  ];
  const seen = new Set<string>();
  allGroups.forEach((g: any) => {
    if (!seen.has(g.id)) {
      seen.add(g.id);
      conversations.push({
        id: `group-${g.id}`,
        type: 'group',
        name: g.name,
        groupId: g.id,
      });
    }
  });

  return conversations;
}

// ================================================================
// EVENTS
// ================================================================

export async function fetchEvents(userId: string, role: 'mentor' | 'mentee') {
  let query = supabase
    .from('events')
    .select(`
      *,
      mentor:profiles!events_mentor_id_fkey(id, full_name, avatar_url),
      rsvps:event_rsvps(
        id, event_id, user_id, status,
        profile:profiles!event_rsvps_user_id_fkey(id, full_name, avatar_url)
      )
    `)
    .order('event_date', { ascending: true });

  if (role === 'mentor') {
    query = query.eq('mentor_id', userId);
  }
  // For mentees, the RLS policy handles visibility

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createEvent(eventData: {
  mentor_id: string;
  title: string;
  description: string;
  event_date: string;
  invite_type: 'group' | 'private';
  invitee_id?: string;
  zoom_link?: string;
}) {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

export async function rsvpToEvent(
  eventId: string,
  userId: string,
  status: 'going' | 'maybe' | 'declined'
) {
  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generate a RFC 5545 .ics calendar file and trigger download
 */
export function downloadICS(event: {
  title: string;
  description: string;
  event_date: string;
  zoom_link?: string | null;
}) {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Propel//Mentorship//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}${event.zoom_link ? '\\nJoin: ' + event.zoom_link : ''}`,
    event.zoom_link ? `URL:${event.zoom_link}` : '',
    `UID:${crypto.randomUUID()}@propel.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ================================================================
// NOTIFICATIONS
// ================================================================

export async function fetchNotifications(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

// ================================================================
// RATINGS (Phase 3 additions)
// ================================================================

export async function submitRating(
  reviewerId: string,
  revieweeId: string,
  connectionId: string,
  score: number,
  comment: string
) {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      connection_id: connectionId,
      score,
      comment,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMyReviews(userId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      reviewee:profiles!ratings_reviewee_id_fkey(id, full_name, avatar_url)
    `)
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchReviewsAboutMe(userId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      reviewer:profiles!ratings_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchUnreviewedConnections(userId: string) {
  // get active/ended connections where user hasn't reviewed the other person
  const { data: connections } = await supabase
    .from('connections')
    .select(`
      *,
      mentor:profiles!connections_mentor_id_fkey(id, full_name, avatar_url),
      mentee:profiles!connections_mentee_id_fkey(id, full_name, avatar_url)
    `)
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
    .in('status', ['active', 'ended']);

  if (!connections) return [];

  // check which ones user has already reviewed
  const { data: existingReviews } = await supabase
    .from('ratings')
    .select('connection_id')
    .eq('reviewer_id', userId);

  const reviewedIds = new Set(
    (existingReviews || []).map((r) => r.connection_id)
  );

  return connections.filter((c) => !reviewedIds.has(c.id));
}

// ================================================================
// SETTINGS
// ================================================================

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    gender?: string;
    avatar_url?: string | null;
    calendly_url?: string;
    field_visibility?: Record<string, string>;
  }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMentorProfileData(
  userId: string,
  updates: {
    bio?: string;
    expertise_tags?: string[];
    mentorship_style?: string;
    max_capacity?: number;
    area_of_mentorship?: string;
    years_of_experience?: number;
    portfolio?: string | null;
  }
) {
  const { data, error } = await supabase
    .from('mentor_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMenteeProfileData(
  userId: string,
  updates: { aspirations?: string; learning_goals?: string[]; desired_skills?: string[] }
) {
  const { data, error } = await supabase
    .from('mentee_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Record<string, boolean>
) {
  const { error } = await supabase
    .from('profiles')
    .update({ notification_prefs: prefs })
    .eq('id', userId);

  if (error) throw error;
}

export async function deleteAccount(userId: string) {
  // End all active connections first
  await supabase
    .from('connections')
    .update({ status: 'ended' })
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
    .eq('status', 'active');

  // Delete the profile (cascades to all related data)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;

  // Sign out
  await supabase.auth.signOut();
}

