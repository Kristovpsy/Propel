import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { Profile } from '../../types';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/verify-email', '/auth/callback', '/forgot-password'];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession, setProfile, setMentorProfile, setMenteeProfile, setLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
        setReady(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setMentorProfile(null);
          setMenteeProfile(null);
          navigate('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      // Use select('*') — PostgREST returns whatever columns it knows about
      // even if schema cache is stale, this won't 406
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        console.error('Profile load error:', error);
        setLoading(false);
        setReady(true);
        return;
      }

      // Patch in defaults for potentially missing new fields
      // (handles case where schema cache hasn't been refreshed yet)
      const fullProfile = {
        ...profile,
        first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
        username: profile.username || null,
        gender: profile.gender || null,
        field_visibility: profile.field_visibility || {},
      } as Profile;

      setProfile(fullProfile);
      await handlePostProfileLoad(fullProfile, userId);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  async function handlePostProfileLoad(profile: Profile, userId: string) {
    // Load role-specific profile
    if (profile.role === 'mentor') {
      const { data: mentorProfile } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (mentorProfile) setMentorProfile(mentorProfile);
    } else if (profile.role === 'mentee') {
      const { data: menteeProfile } = await supabase
        .from('mentee_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (menteeProfile) setMenteeProfile(menteeProfile);
    }

    // Route based on onboarding status
    if (!profile.onboarding_complete) {
      const onboardingRoute = `/onboarding/${profile.role}`;
      if (location.pathname !== onboardingRoute) {
        navigate(onboardingRoute);
      }
    } else if (PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/dashboard');
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient-subtle">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-green-200 border-t-brand-green-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-montserrat font-medium">Loading Propel...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
