import { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import {
  fetchMyReviews,
  fetchReviewsAboutMe,
  fetchUnreviewedConnections,
} from '../../lib/api';
import StarRating from '../../components/ratings/StarRating';
import ReviewModal from '../../components/ratings/ReviewModal';
import { Star, PenLine, Loader2, MessageSquare } from 'lucide-react';

type Tab = 'give' | 'given' | 'received';

export default function RatingsPage() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('give');
  const [unreviewedConnections, setUnreviewedConnections] = useState<any[]>([]);
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewConnection, setReviewConnection] = useState<any | null>(null);

  async function loadData() {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const [unreviewed, given, received] = await Promise.all([
        fetchUnreviewedConnections(profile.id),
        fetchMyReviews(profile.id),
        fetchReviewsAboutMe(profile.id),
      ]);
      setUnreviewedConnections(unreviewed);
      setGivenReviews(given);
      setReceivedReviews(received);
    } catch (err) {
      console.error('Failed to load ratings:', err);
      toast.error('Failed to load ratings data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'give', label: 'Give Review', count: unreviewedConnections.length },
    { key: 'given', label: 'Your Reviews', count: givenReviews.length },
    { key: 'received', label: 'About You', count: receivedReviews.length },
  ];

  function getPartnerInfo(conn: any) {
    const isMentor = profile?.id === conn.mentor_id;
    const partner = isMentor ? conn.mentee : conn.mentor;
    return {
      name: partner?.full_name || 'Unknown',
      avatar: partner?.avatar_url,
      role: isMentor ? 'Mentee' : 'Mentor',
    };
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          Ratings & Reviews
        </h1>
        <p className="text-slate-500 ml-[52px]">
          Leave feedback and see what others say about you.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 shadow-card border border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-brand-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500" />
        </div>
      ) : (
        <>
          {/* Give Review Tab */}
          {activeTab === 'give' && (
            <div>
              {unreviewedConnections.length > 0 ? (
                <div className="space-y-3">
                  {unreviewedConnections.map((conn) => {
                    const partner = getPartnerInfo(conn);
                    return (
                      <div
                        key={conn.id}
                        className="card p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {partner.avatar ? (
                            <img
                              src={partner.avatar}
                              alt={partner.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                              {partner.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {partner.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {partner.role} · {conn.status === 'active' ? 'Active' : 'Ended'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setReviewConnection(conn)}
                          className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Write Review
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">
                    No pending reviews
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You've reviewed all your active connections.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Given Reviews Tab */}
          {activeTab === 'given' && (
            <div>
              {givenReviews.length > 0 ? (
                <div className="space-y-3">
                  {givenReviews.map((review) => (
                    <div key={review.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {review.reviewee?.avatar_url ? (
                            <img
                              src={review.reviewee.avatar_url}
                              alt={review.reviewee.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                              {review.reviewee?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {review.reviewee?.full_name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(review.created_at).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </p>
                          </div>
                        </div>
                        <StarRating value={review.score} size="sm" readonly />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <PenLine className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">
                    No reviews yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your written reviews will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Received Reviews Tab */}
          {activeTab === 'received' && (
            <div>
              {receivedReviews.length > 0 ? (
                <div className="space-y-3">
                  {receivedReviews.map((review) => (
                    <div key={review.id} className="card p-4">
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
                            <p className="text-[10px] text-slate-400">
                              {new Date(review.created_at).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </p>
                          </div>
                        </div>
                        <StarRating value={review.score} size="sm" readonly />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">
                    No reviews about you yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Reviews from your connections will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {reviewConnection && profile && (
        <ReviewModal
          connection={reviewConnection}
          reviewerId={profile.id}
          onClose={() => setReviewConnection(null)}
          onSuccess={() => {
            setReviewConnection(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
