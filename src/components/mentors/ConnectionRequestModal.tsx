import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { connectionRequestSchema, type ConnectionRequestFormData } from '../../lib/validators';
import { sendConnectionRequest } from '../../lib/api';
import { X, Loader2, Send, CheckCircle } from 'lucide-react';

interface ConnectionRequestModalProps {
  mentorId: string;
  mentorName: string;
  menteeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectionRequestModal({
  mentorId,
  mentorName,
  menteeId,
  onClose,
  onSuccess,
}: ConnectionRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectionRequestFormData>({
    resolver: zodResolver(connectionRequestSchema),
    defaultValues: {
      request_message: '',
    },
  });

  async function onSubmit(data: ConnectionRequestFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await sendConnectionRequest(mentorId, menteeId, data.request_message);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send request';
      if (message.includes('capacity')) {
        setError('This mentor is currently at capacity and cannot accept new requests.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              Request Mentorship
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Send a request to{' '}
              <span className="font-semibold text-slate-700">
                {mentorName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
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
              Request Sent!
            </h3>
            <p className="text-sm text-slate-500">
              {mentorName} will review your request. You'll be notified when
              they respond.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-6">
              <label className="label">
                Introduce yourself and explain why you'd like this mentorship
              </label>
              <textarea
                {...register('request_message')}
                className="input-field min-h-[140px] resize-none"
                placeholder="Hi! I'm looking for guidance in... I believe your experience in... would really help me..."
                disabled={isSubmitting}
              />
              {errors.request_message && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.request_message.message}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Minimum 20 characters. Be specific about your goals and what
                you hope to learn.
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
                type="button"
                onClick={onClose}
                className="btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
