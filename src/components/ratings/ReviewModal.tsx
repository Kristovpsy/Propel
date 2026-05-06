import { useState } from 'react';
import { X, Loader2, CheckCircle } from 'lucide-react';
import StarRating from './StarRating';
import { submitRating } from '../../lib/api';

interface ReviewModalProps {
  connection: {
    id: string;
    mentor_id: string;
    mentee_id: string;
    mentor?: { full_name?: string; avatar_url?: string | null };
    mentee?: { full_name?: string; avatar_url?: string | null };
  };
  reviewerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  connection,
  reviewerId,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine who we're reviewing
  const isMentor = reviewerId === connection.mentor_id;
  const reviewee = isMentor ? connection.mentee : connection.mentor;
  const revieweeId = isMentor ? connection.mentee_id : connection.mentor_id;
  const revieweeName = (reviewee as any)?.full_name || 'this person';
  const revieweeAvatar = (reviewee as any)?.avatar_url;

  async function handleSubmit() {
    if (score === 0) {
      setError('Please select a star rating');
      return;
    }
    if (comment.length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitRating(reviewerId, revieweeId, connection.id, score, comment);
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900">
            Leave a Review
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Review Submitted!
            </h3>
            <p className="text-sm text-slate-500">
              Thank you for your feedback.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-6">
              {/* Reviewee info */}
              <div className="flex items-center gap-3 mb-6">
                {revieweeAvatar ? (
                  <img
                    src={revieweeAvatar}
                    alt={revieweeName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                    {revieweeName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">
                    {revieweeName}
                  </p>
                  <p className="text-xs text-slate-400">
                    How was your experience?
                  </p>
                </div>
              </div>

              {/* Star rating */}
              <div className="flex justify-center mb-6">
                <StarRating value={score} onChange={setScore} size="lg" />
              </div>

              {/* Comment */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="Share your experience..."
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Minimum 10 characters
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mt-4">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={onClose}
                className="btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || score === 0}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
