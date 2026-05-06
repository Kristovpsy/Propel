import { useState } from 'react';
import {
  Calendar, Clock, Users, User, ExternalLink, Download,
  Check, HelpCircle, X, Trash2, Loader2,
} from 'lucide-react';
import { rsvpToEvent, downloadICS, deleteEvent } from '../../lib/api';

interface EventCardProps {
  event: any;
  userId: string;
  isMentor: boolean;
  onUpdate: () => void;
}

export default function EventCard({
  event,
  userId,
  isMentor,
  onUpdate,
}: EventCardProps) {
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();
  const rsvps = event.rsvps || [];
  const userRsvp = rsvps.find((r: any) => r.user_id === userId);
  const goingCount = rsvps.filter((r: any) => r.status === 'going').length;

  async function handleRsvp(status: 'going' | 'maybe' | 'declined') {
    setRsvpLoading(status);
    try {
      await rsvpToEvent(event.id, userId, status);
      onUpdate();
    } catch (err) {
      console.error('RSVP failed:', err);
    } finally {
      setRsvpLoading(null);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const rsvpButtons = [
    { status: 'going' as const, label: 'Going', icon: Check, color: 'emerald' },
    { status: 'maybe' as const, label: 'Maybe', icon: HelpCircle, color: 'amber' },
    { status: 'declined' as const, label: 'Decline', icon: X, color: 'red' },
  ];

  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden transition-all hover:shadow-card-hover ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  event.invite_type === 'group'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-brand-blue-100 text-brand-blue-700'
                }`}
              >
                {event.invite_type === 'group' ? 'Group' : 'Private'}
              </span>
              {isPast && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Past
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
          </div>

          {/* Mentor controls */}
          {isMentor && event.mentor_id === userId && (
            <div className="flex-shrink-0 ml-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-[10px] font-semibold text-red-600 hover:text-red-700 px-1.5 py-0.5"
                  >
                    {isDeleting ? '...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date and time */}
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            {event.invite_type === 'group' ? (
              <Users className="w-3.5 h-3.5" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            {goingCount} going
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Mentor info */}
        {event.mentor && !isMentor && (
          <div className="flex items-center gap-2 mb-3">
            {event.mentor.avatar_url ? (
              <img
                src={event.mentor.avatar_url}
                alt={event.mentor.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold">
                {event.mentor.full_name?.charAt(0)}
              </div>
            )}
            <span className="text-xs text-slate-500">
              by{' '}
              <span className="font-semibold text-slate-700">
                {event.mentor.full_name}
              </span>
            </span>
          </div>
        )}

        {/* Attendee avatars */}
        {rsvps.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex -space-x-2">
              {rsvps
                .filter((r: any) => r.status === 'going')
                .slice(0, 5)
                .map((r: any) => (
                  <div key={r.id}>
                    {r.profile?.avatar_url ? (
                      <img
                        src={r.profile.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white">
                        {r.profile?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {goingCount > 5 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{goingCount - 5} more
              </span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* RSVP buttons (mentees only, not past) */}
          {!isMentor && !isPast && (
            <>
              {rsvpButtons.map(({ status, label, icon: Icon, color }) => {
                const isActive = userRsvp?.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleRsvp(status)}
                    disabled={rsvpLoading !== null}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                          : color === 'amber'
                            ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                            : 'bg-red-100 text-red-600 ring-1 ring-red-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {rsvpLoading === status ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    {label}
                  </button>
                );
              })}
            </>
          )}

          <div className="flex-1" />

          {/* Zoom link */}
          {event.zoom_link && !isPast && (
            <a
              href={event.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Join Meeting
            </a>
          )}

          {/* Export ICS */}
          <button
            onClick={() => downloadICS(event)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3 h-3" />
            .ics
          </button>
        </div>
      </div>
    </div>
  );
}
