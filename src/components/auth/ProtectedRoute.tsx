import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { type ReactNode } from 'react';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-green-200 border-t-brand-green-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-montserrat text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSkeleton />;

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

  if (isLoading) return <LoadingSkeleton />;

  if (session && profile?.onboarding_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

