import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { type ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && profile && !profile.onboarding_complete) {
    return <Navigate to={`/onboarding/${profile.role}`} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (session && profile?.onboarding_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
