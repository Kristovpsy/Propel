import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import {
  fetchMentors,
  fetchMentorById,
  fetchMenteeById,
  fetchRecommendedMentors,
  fetchMatchedMentors,
  fetchConnections,
  fetchConnectionStatus,
  fetchCurriculum,
  fetchMentorDashboardStats,
  fetchMenteeDashboardStats,
  type MentorSearchFilters,
  type MentorWithProfile,
} from './api';
import type { Connection, Curriculum, MenteeProfile, MatchResult } from '../types';

// ================================================================
// Generic async data hook with in-memory SWR cache
// ================================================================

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple in-memory cache: key → { data, timestamp }
const asyncDataCache = new Map<string, { data: unknown; timestamp: number }>();

function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  cacheKey?: string
): AsyncState<T> {
  // Build a stable cache key from deps
  const key = cacheKey || deps.map((d) => String(d ?? '')).join('::');
  const cached = key ? asyncDataCache.get(key) : undefined;

  // Start with cached data if available (stale-while-revalidate)
  const [data, setData] = useState<T | null>(
    cached ? (cached.data as T) : null
  );
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Only show loading spinner if we have no cached data to display
    if (!asyncDataCache.has(key)) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      // Update cache
      if (key) {
        asyncDataCache.set(key, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

// ================================================================
// MENTOR HOOKS
// ================================================================

export function useMentors(filters: MentorSearchFilters = {}) {
  return useAsyncData<MentorWithProfile[]>(
    () => fetchMentors(filters),
    [filters.search, filters.tags?.join(','), filters.availableOnly]
  );
}

export function useMentorProfile(userId: string | undefined) {
  return useAsyncData(
    () => {
      if (!userId) throw new Error('No user ID');
      return fetchMentorById(userId);
    },
    [userId]
  );
}

export function useMenteeProfileById(userId: string | undefined) {
  return useAsyncData(
    () => {
      if (!userId) throw new Error('No user ID');
      return fetchMenteeById(userId);
    },
    [userId]
  );
}

export function useRecommendedMentors(
  menteeProfile: MenteeProfile | null,
  excludeIds: string[] = [],
  limit: number = 6
) {
  return useAsyncData<MentorWithProfile[]>(
    () => {
      if (!menteeProfile) return Promise.resolve([]);
      return fetchRecommendedMentors(menteeProfile, excludeIds, limit);
    },
    [menteeProfile?.id, excludeIds.join(','), limit]
  );
}

export function useMatchedMentors(
  menteeId: string | undefined,
  limit: number = 10
) {
  return useAsyncData<MatchResult[]>(
    () => {
      if (!menteeId) return Promise.resolve([]);
      return fetchMatchedMentors(menteeId, limit);
    },
    [menteeId, limit]
  );
}

// ================================================================
// CONNECTION HOOKS
// ================================================================

export function useConnections(userId: string | undefined, role: 'mentor' | 'mentee') {
  const result = useAsyncData<Connection[]>(
    () => {
      if (!userId) return Promise.resolve([]);
      return fetchConnections(userId, role);
    },
    [userId, role]
  );

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!userId) return;

    const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
    const channel = supabase
      .channel(`connections-${role}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `${column}=eq.${userId}`,
        },
        () => {
          result.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  return result;
}

export function useConnectionStatus(
  mentorId: string | undefined,
  menteeId: string | undefined
) {
  return useAsyncData(
    () => {
      if (!mentorId || !menteeId) return Promise.resolve(null);
      return fetchConnectionStatus(mentorId, menteeId);
    },
    [mentorId, menteeId]
  );
}

// ================================================================
// CURRICULUM HOOKS
// ================================================================

export function useCurriculum(connectionId: string | undefined) {
  return useAsyncData<Curriculum | null>(
    () => {
      if (!connectionId) return Promise.resolve(null);
      return fetchCurriculum(connectionId);
    },
    [connectionId]
  );
}

// ================================================================
// DASHBOARD HOOKS
// ================================================================

export function useMentorDashboardStats(userId: string | undefined) {
  return useAsyncData(
    () => {
      if (!userId) return Promise.resolve({ activeCount: 0, pendingCount: 0, upcomingEvents: 0 });
      return fetchMentorDashboardStats(userId);
    },
    [userId]
  );
}

export function useMenteeDashboardStats(userId: string | undefined) {
  return useAsyncData(
    () => {
      if (!userId)
        return Promise.resolve({
          activeMentors: 0,
          goalsInProgress: 0,
          upcomingSessions: 0,
          growthScore: 0,
        });
      return fetchMenteeDashboardStats(userId);
    },
    [userId]
  );
}
