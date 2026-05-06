import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { useMenteeProfileById, useConnectionStatus } from '../../lib/hooks';
import {
  ArrowLeft, Users, Sparkles, BookOpen, Target,
  CheckCircle, XCircle, MessageSquare, Send,
} from 'lucide-react';

export default function MenteeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuthStore();
  const { data: mentee, isLoading, error } = useMenteeProfileById(id);
  const { data: connectionStatus } = useConnectionStatus(
    currentUser?.id,
    id
  );

  const mp = mentee?.mentee_profiles?.[0];
  const isOwnProfile = currentUser?.id === id;
  const isMentor = currentUser?.role === 'mentor';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded mb-8" />
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
              <div className="h-8 bg-slate-100 rounded-full w-28" />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !mentee) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Mentee not found
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          This mentee profile doesn't exist or has been removed.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Hero card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            {/* Gradient banner */}
            <div className="h-24 bg-brand-gradient opacity-90" />

            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="flex items-end gap-5 -mt-12 mb-6">
                {mentee.avatar_url ? (
                  <img
                    src={mentee.avatar_url}
                    alt={mentee.full_name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-gradient flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                    {mentee.full_name?.charAt(0) || '?'}
                  </div>
                )}

                <div className="pb-1.5">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {mentee.full_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-blue-50 text-brand-blue-600">
                      <Users className="w-3 h-3" />
                      {mentee.active_mentors} active mentor{mentee.active_mentors !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-400">
                      Joined {new Date(mentee.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aspirations */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-blue-500" />
                  Aspirations
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {mp?.aspirations || 'No aspirations provided.'}
                </p>
              </div>

              {/* Learning Goals */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-green-500" />
                  Learning Goals
                </h2>
                {(mp?.learning_goals || []).length > 0 ? (
                  <div className="space-y-2">
                    {mp!.learning_goals.map((goal, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-brand-green-600">
                            {i + 1}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No learning goals listed.</p>
                )}
              </div>

              {/* Desired Skills */}
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-blue-500" />
                  Desired Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(mp?.desired_skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                  {(mp?.desired_skills || []).length === 0 && (
                    <p className="text-sm text-slate-400">No desired skills listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
          {/* Connection CTA card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            {isOwnProfile ? (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-3">This is your profile</p>
                <Link to="/settings" className="btn-secondary text-sm w-full block text-center">
                  Edit Profile
                </Link>
              </div>
            ) : !isMentor ? (
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  Only mentors can view mentee connection details.
                </p>
              </div>
            ) : connectionStatus?.status === 'active' ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Your Mentee
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  You're currently mentoring {mentee.full_name}.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/goals"
                    className="btn-primary text-sm w-full block text-center"
                  >
                    View Curriculum
                  </Link>
                  <Link
                    to="/messages"
                    className="btn-secondary text-sm w-full flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Link>
                </div>
              </div>
            ) : connectionStatus?.status === 'pending' ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6 text-amber-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Request Pending
                </p>
                <p className="text-xs text-slate-500">
                  {mentee.full_name} has sent you a connection request.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-500">
                  No active connection with this mentee.
                </p>
              </div>
            )}
          </div>

          {/* Quick stats card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Quick Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Active Mentors</span>
                <span className="text-sm font-bold text-slate-900">
                  {mentee.active_mentors}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Goals</span>
                <span className="text-sm font-bold text-slate-900">
                  {(mp?.learning_goals || []).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Skills</span>
                <span className="text-sm font-bold text-slate-900">
                  {(mp?.desired_skills || []).length} areas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
