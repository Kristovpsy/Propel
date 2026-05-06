import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import {
  useConnections,
  useMentorDashboardStats,
  useMenteeDashboardStats,
  useRecommendedMentors,
} from '../../lib/hooks';
import { updateConnectionStatus } from '../../lib/api';
import {
  Users, Clock, Target, TrendingUp, Calendar, ArrowRight,
  Check, X, Loader2, Compass, Star,
} from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuthStore();

  if (profile?.role === 'mentor') return <MentorDashboard />;
  return <MenteeDashboard />;
}

// ================================================================
// MENTOR DASHBOARD
// ================================================================

function MentorDashboard() {
  const { profile, mentorProfile } = useAuthStore();
  const toast = useToast();
  const { data: stats, refetch: refetchStats } = useMentorDashboardStats(profile?.id);
  const {
    data: connections,
    isLoading: loadingConnections,
    refetch: refetchConnections,
  } = useConnections(profile?.id, 'mentor');

  const pendingRequests = useMemo(
    () => (connections || []).filter((c) => c.status === 'pending'),
    [connections]
  );

  const activeMentees = useMemo(
    () => (connections || []).filter((c) => c.status === 'active'),
    [connections]
  );

  async function handleAccept(connectionId: string) {
    try {
      await updateConnectionStatus(connectionId, 'active');
      refetchConnections();
      refetchStats();
    } catch (err) {
      console.error('Failed to accept:', err);
      toast.error('Failed to accept connection.');
    }
  }

  async function handleReject(connectionId: string) {
    try {
      await updateConnectionStatus(connectionId, 'rejected');
      refetchConnections();
      refetchStats();
    } catch (err) {
      console.error('Failed to reject:', err);
      toast.error('Failed to decline connection.');
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Welcome back,{' '}
          <span className="gradient-text">
            {profile?.full_name?.split(' ')[0]}
          </span>{' '}
          👋
        </h1>
        <p className="text-slate-500">
          Here's an overview of your mentorship activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Active Mentees',
            value: stats?.activeCount ?? mentorProfile?.current_count ?? 0,
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Capacity',
            value: `${stats?.activeCount ?? mentorProfile?.current_count ?? 0}/${mentorProfile?.max_capacity || 5}`,
            icon: Target,
            color: 'green',
          },
          {
            label: 'Pending Requests',
            value: stats?.pendingCount ?? 0,
            icon: Clock,
            color: 'yellow',
          },
          {
            label: 'Upcoming Events',
            value: stats?.upcomingEvents ?? 0,
            icon: Calendar,
            color: 'purple',
          },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stat.color === 'blue'
                    ? 'bg-brand-blue-100'
                    : stat.color === 'green'
                      ? 'bg-brand-green-100'
                      : stat.color === 'yellow'
                        ? 'bg-yellow-100'
                        : 'bg-purple-100'
                }`}
              >
                <stat.icon
                  className={`w-5 h-5 ${
                    stat.color === 'blue'
                      ? 'text-brand-blue-600'
                      : stat.color === 'green'
                        ? 'text-brand-green-600'
                        : stat.color === 'yellow'
                          ? 'text-yellow-600'
                          : 'text-purple-600'
                  }`}
                />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Pending Requests</h2>
            <span className="badge-blue">{pendingRequests.length} pending</span>
          </div>

          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {pendingRequests.map((conn) => {
                const mentee = (conn as any).mentee;
                const menteeProfile = mentee?.mentee_profiles?.[0];

                return (
                  <div
                    key={conn.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      {mentee?.avatar_url ? (
                        <img
                          src={mentee.avatar_url}
                          alt={mentee.full_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold ring-2 ring-white">
                          {mentee?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {mentee?.full_name || 'Unknown'}
                        </p>
                        {menteeProfile?.aspirations && (
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {menteeProfile.aspirations}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(conn.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Request message */}
                    {conn.request_message && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-slate-100">
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          "{conn.request_message}"
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(conn.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(conn.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Clock className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No pending requests</p>
              <p className="text-xs">
                New connection requests will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Active Mentees */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Your Mentees</h2>
            <span className="badge-green">
              {activeMentees.length} active
            </span>
          </div>

          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : activeMentees.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {activeMentees.map((conn) => {
                const mentee = (conn as any).mentee;

                return (
                  <Link
                    key={conn.id}
                    to={`/mentee/${conn.mentee_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    {mentee?.avatar_url ? (
                      <img
                        src={mentee.avatar_url}
                        alt={mentee.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                        {mentee?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-brand-blue-600 transition-colors">
                        {mentee?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Connected{' '}
                        {new Date(conn.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className="text-xs text-brand-blue-600 font-medium hover:underline"
                    >
                      Goals
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Users className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No mentees yet</p>
              <p className="text-xs">
                Your accepted mentees will show here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MENTEE DASHBOARD
// ================================================================

function MenteeDashboard() {
  const { profile, menteeProfile } = useAuthStore();
  const { data: stats } = useMenteeDashboardStats(profile?.id);
  const {
    data: connections,
    isLoading: loadingConnections,
  } = useConnections(profile?.id, 'mentee');

  const activeConnections = useMemo(
    () => (connections || []).filter((c) => c.status === 'active'),
    [connections]
  );

  const pendingConnections = useMemo(
    () => (connections || []).filter((c) => c.status === 'pending'),
    [connections]
  );

  // Get mentor IDs to exclude from recommendations
  const excludeIds = useMemo(
    () => (connections || []).map((c) => c.mentor_id),
    [connections]
  );

  const { data: recommendedMentors } = useRecommendedMentors(
    menteeProfile,
    excludeIds,
    3
  );

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Welcome back,{' '}
          <span className="gradient-text">
            {profile?.full_name?.split(' ')[0]}
          </span>{' '}
          👋
        </h1>
        <p className="text-slate-500">
          Track your mentorship progress and discover new mentors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Active Mentors',
            value: stats?.activeMentors ?? 0,
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Goals in Progress',
            value: stats?.goalsInProgress ?? 0,
            icon: Target,
            color: 'green',
          },
          {
            label: 'Sessions',
            value: stats?.upcomingSessions ?? 0,
            icon: Calendar,
            color: 'purple',
          },
          {
            label: 'Growth Score',
            value: stats?.growthScore ? `${stats.growthScore}%` : '—',
            icon: TrendingUp,
            color: 'yellow',
          },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stat.color === 'blue'
                    ? 'bg-brand-blue-100'
                    : stat.color === 'green'
                      ? 'bg-brand-green-100'
                      : stat.color === 'purple'
                        ? 'bg-purple-100'
                        : 'bg-yellow-100'
                }`}
              >
                <stat.icon
                  className={`w-5 h-5 ${
                    stat.color === 'blue'
                      ? 'text-brand-blue-600'
                      : stat.color === 'green'
                        ? 'text-brand-green-600'
                        : stat.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-yellow-600'
                  }`}
                />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending requests notification */}
      {pendingConnections.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-slide-up">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingConnections.length} pending request{pendingConnections.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600">
              {pendingConnections.map((c) => {
                const mentor = (c as any).mentor;
                return mentor?.full_name || 'A mentor';
              }).join(', ')}{' '}
              {pendingConnections.length === 1 ? 'is reviewing your request' : 'are reviewing your requests'}.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Active Mentor */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Your Mentor{activeConnections.length > 1 ? 's' : ''}</h2>
            {activeConnections.length > 0 && (
              <span className="badge-green">{activeConnections.length} active</span>
            )}
          </div>

          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : activeConnections.length > 0 ? (
            <div className="space-y-3">
              {activeConnections.map((conn) => {
                const mentor = (conn as any).mentor;
                const mentorProfile = mentor?.mentor_profiles?.[0];

                return (
                  <Link
                    key={conn.id}
                    to={`/mentor/${conn.mentor_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    {mentor?.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt={mentor.full_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold ring-2 ring-white shadow-sm">
                        {mentor?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-blue-600 transition-colors truncate">
                        {mentor?.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {mentorProfile?.mentorship_style || 'Mentor'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors" />
                  </Link>
                );
              })}
              <Link
                to="/goals"
                className="block text-center py-2 text-sm text-brand-blue-600 font-medium hover:underline"
              >
                View Curriculum →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Users className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No active mentor</p>
              <p className="text-xs mb-3">
                Send a connection request to get started.
              </p>
              <Link
                to="/explore"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                Explore Mentors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Mentors */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Recommended for You</h2>
            <Link
              to="/explore"
              className="text-xs text-brand-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recommendedMentors && recommendedMentors.length > 0 ? (
            <div className="space-y-3">
              {recommendedMentors.slice(0, 3).map((mentor) => {
                const mp = mentor.mentor_profiles?.[0];
                return (
                  <Link
                    key={mentor.id}
                    to={`/mentor/${mentor.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt={mentor.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                        {mentor.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-brand-blue-600 transition-colors">
                        {mentor.full_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(mp?.expertise_tags || []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-brand-blue-600 bg-brand-blue-50 px-1.5 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {(mentor.avg_rating ?? 0) > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-slate-500">
                          {(mentor.avg_rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Compass className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No recommendations yet</p>
              <p className="text-xs">
                We'll suggest mentors as more join the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
