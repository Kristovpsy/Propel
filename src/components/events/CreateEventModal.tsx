import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, type EventFormData } from '../../lib/validators';
import { createEvent, fetchConnections } from '../../lib/api';
import { X, Loader2, Calendar, Users, User } from 'lucide-react';

interface CreateEventModalProps {
  mentorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({
  mentorId,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentees, setMentees] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      invite_type: 'group',
      invitee_id: '',
      zoom_link: '',
    },
  });

  const inviteType = watch('invite_type');

  // Load connected mentees for private events
  useEffect(() => {
    async function loadMentees() {
      try {
        const connections = await fetchConnections(mentorId, 'mentor');
        const activeMentees = connections
          .filter((c) => c.status === 'active')
          .map((c: any) => ({
            id: c.mentee?.id || c.mentee_id,
            name: c.mentee?.full_name || 'Unknown',
          }));
        setMentees(activeMentees);
      } catch (err) {
        console.error('Failed to load mentees:', err);
      }
    }
    loadMentees();
  }, [mentorId]);

  async function onSubmit(data: EventFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createEvent({
        mentor_id: mentorId,
        title: data.title,
        description: data.description || '',
        event_date: new Date(data.event_date).toISOString(),
        invite_type: data.invite_type,
        invitee_id: data.invite_type === 'private' ? data.invitee_id : undefined,
        zoom_link: data.zoom_link || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
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

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Create Event</h2>
              <p className="text-xs text-slate-500">
                Schedule a mentorship session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="label">Event Title</label>
              <input
                {...register('title')}
                className="input-field"
                placeholder="e.g. Weekly Check-in"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                {...register('description')}
                className="input-field min-h-[80px] resize-none"
                placeholder="What will you cover in this session?"
                disabled={isSubmitting}
              />
            </div>

            {/* Date and Time */}
            <div>
              <label className="label">Date & Time</label>
              <input
                type="datetime-local"
                {...register('event_date')}
                className="input-field"
                disabled={isSubmitting}
              />
              {errors.event_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.event_date.message}
                </p>
              )}
            </div>

            {/* Invite type */}
            <div>
              <label className="label">Invite Type</label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    inviteType === 'group'
                      ? 'border-brand-blue-300 bg-brand-blue-50 text-brand-blue-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('invite_type')}
                    value="group"
                    className="sr-only"
                  />
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Group</span>
                </label>
                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    inviteType === 'private'
                      ? 'border-brand-blue-300 bg-brand-blue-50 text-brand-blue-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('invite_type')}
                    value="private"
                    className="sr-only"
                  />
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Private</span>
                </label>
              </div>
            </div>

            {/* Mentee selector (private only) */}
            {inviteType === 'private' && (
              <div>
                <label className="label">Select Mentee</label>
                <select
                  {...register('invitee_id')}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="">Choose a mentee...</option>
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Zoom link */}
            <div>
              <label className="label">
                Meeting Link (optional)
              </label>
              <input
                {...register('zoom_link')}
                className="input-field"
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                disabled={isSubmitting}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Paste a Zoom, Google Meet, or any video call link.
              </p>
              {errors.zoom_link && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.zoom_link.message}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
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
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
