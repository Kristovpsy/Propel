import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, MentorProfile, MenteeProfile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  mentorProfile: MentorProfile | null;
  menteeProfile: MenteeProfile | null;
  isLoading: boolean;
  unreadNotifications: number;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setMentorProfile: (profile: MentorProfile | null) => void;
  setMenteeProfile: (profile: MenteeProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  mentorProfile: null,
  menteeProfile: null,
  isLoading: true,
  unreadNotifications: 0,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setMentorProfile: (mentorProfile) => set({ mentorProfile }),
  setMenteeProfile: (menteeProfile) => set({ menteeProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
  incrementUnread: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
  reset: () => set({
    session: null,
    user: null,
    profile: null,
    mentorProfile: null,
    menteeProfile: null,
    isLoading: false,
    unreadNotifications: 0,
  }),
}));
