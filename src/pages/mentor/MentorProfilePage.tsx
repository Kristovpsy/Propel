import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { useMentorProfile, useConnectionStatus } from '../../lib/hooks';
import ConnectionRequestModal from '../../components/mentors/ConnectionRequestModal';
import {
  ArrowLeft, Star, Users, Briefcase, MessageSquare, Shield,
  Clock, Send, CheckCircle, XCircle,
} from 'lucide-react';

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuthStore();
  const { data: mentor, isLoading, error } = useMentorProfile(id);
  const { data: connectionStatus, refetch: refetchConnection } =
    useConnectionStatus(id, currentUser?.id);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const mp = mentor?.mentor_profiles?.[0];
  const workHistory = (mp?.work_history || []) as { role: string; company: string; years: number }[];
  const reviews = mentor?.ratings || [];
  const avgRating = mentor?.avg_rating || 0;
  const isAtCapacity = mp?.is_at_capacity ?? false;
  const isMentee = currentUser?.role === 'mentee';
  const isOwnProfile = currentUser?.id === id;

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

  if (error || !mentor) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Mentor not found
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          This mentor profile doesn't exist or has been removed.
        </p>
        <button onClick={() => navigate('/explore')} className="btn-primary text-sm">
          Browse Mentors
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
              {/* Avatar (overlapping banner) */}
              <div className="flex items-end gap-5 -mt-12 mb-6">
                {mentor.avatar_url ? (
                  <img
                    src={mentor.avatar_url}
                    alt={mentor.full_name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-gradient flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                    {mentor.full_name?.charAt(0) || '?'}
                  </div>
                )}

                <div className="pb-1.5">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {mentor.full_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Rating */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(avgRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-500 font-medium">
                          {avgRating.toFixed(1)} ({reviews.length} review
                          {reviews.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    )}

                    {/* Capacity badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isAtCapacity
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      {isAtCapacity
                        ? 'At Capacity'
                        : `${mp?.current_count || 0}/${mp?.max_capacity || 5} mentees`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-blue-500" />
                  About
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {mp?.bio || 'No bio provided.'}
                </p>
              </div>

              {/* Expertise tags */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-green-500" />
                  Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(mp?.expertise_tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mentorship style */}
              {mp?.mentorship_style && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Mentorship Style
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green-50 border border-brand-green-100">
                    <span className="text-sm font-semibold text-brand-green-700">
                      {mp.mentorship_style}
                    </span>
                  </div>
                </div>
              )}

              {/* Work history */}
              {workHistory.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Experience
                  </h2>
                  <div className="space-y-3">
                    {workHistory.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {entry.role}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {entry.company} · {entry.years} year
                            {entry.years !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews section */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Reviews ({reviews.length})
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {review.reviewer?.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                            {review.reviewer?.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {review.reviewer?.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= review.score
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Star className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="text-xs">
                  Reviews will appear here after mentorship sessions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA sidebar */}
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
            ) : !isMentee ? (
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  Only mentees can request mentorship.
                </p>
              </div>
            ) : connectionStatus?.status === 'active' ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Your Mentor
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  You're currently connected with {mentor.full_name}.
                </p>
                <Link
                  to="/goals"
                  className="btn-primary text-sm w-full block text-center"
                >
                  View Curriculum
                </Link>
              </div>
            ) : connectionStatus?.status === 'pending' ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Request Pending
                </p>
                <p className="text-xs text-slate-500">
                  Waiting for {mentor.full_name} to review your request.
                </p>
              </div>
            ) : isAtCapacity ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  At Capacity
                </p>
                <p className="text-xs text-slate-500">
                  {mentor.full_name} is not accepting new mentees at this time.
                </p>
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-900 text-sm mb-2">
                  Interested in mentorship?
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Send a connection request and tell {mentor.full_name} about
                  your goals.
                </p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  Request Mentorship
                </button>
              </>
            )}
          </div>

          {/* Quick stats card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Mentees</span>
                <span className="text-sm font-bold text-slate-900">
                  {mp?.current_count || 0}/{mp?.max_capacity || 5}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Rating</span>
                <span className="text-sm font-bold text-slate-900">
                  {avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Reviews</span>
                <span className="text-sm font-bold text-slate-900">
                  {reviews.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Expertise</span>
                <span className="text-sm font-bold text-slate-900">
                  {(mp?.expertise_tags || []).length} areas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection request modal */}
      {showRequestModal && currentUser && (
        <ConnectionRequestModal
          mentorId={mentor.id}
          mentorName={mentor.full_name}
          menteeId={currentUser.id}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            refetchConnection();
          }}
        />
      )}
    </div>
  );
}
