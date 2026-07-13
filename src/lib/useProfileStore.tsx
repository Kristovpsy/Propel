// src/lib/useProfileStore.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from './store';
import { getProfile, cacheProfile, clearProfileCache } from './store';
import type { Profile } from '../types';

interface ProfileContextValue {
  profile: Profile | null;
  loadProfile: (id: string) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, setProfile } = useAuthStore();
  const [profile, setLocalProfile] = useState<Profile | null>(null);

  const loadProfile = async (id: string): Promise<Profile | null> => {
    const cached = getProfile(id);
    if (cached) {
      setLocalProfile(cached);
      return cached;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) {
      console.warn('[profile] fetch error:', error.message);
      return null;
    }
    if (data) {
      cacheProfile(data as Profile);
      setLocalProfile(data as Profile);
      setProfile(data as Profile);
    }
    return data as Profile;
  };

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  useEffect(() => {
    if (user?.id) loadProfile(user.id);
    else setLocalProfile(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user) clearProfileCache();
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, loadProfile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
};
