import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CheckCircle, XCircle, MessageSquare,
  Calendar, Star, Bell,
} from 'lucide-react';
import type { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  connection_request: UserPlus,
  connection_accepted: CheckCircle,
  connection_rejected: XCircle,
  new_message: MessageSquare,
  event_created: Calendar,
  event_reminder: Calendar,
  review_received: Star,
};

const COLOR_MAP: Record<string, string> = {
  connection_request: 'bg-brand-blue-100 text-brand-blue-600',
  connection_accepted: 'bg-emerald-100 text-emerald-600',
  connection_rejected: 'bg-red-100 text-red-600',
  new_message: 'bg-purple-100 text-purple-600',
  event_created: 'bg-amber-100 text-amber-600',
  event_reminder: 'bg-amber-100 text-amber-600',
  review_received: 'bg-yellow-100 text-yellow-600',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[notification.type] || Bell;
  const colorClass = COLOR_MAP[notification.type] || 'bg-slate-100 text-slate-600';

  function handleClick() {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
        notification.is_read
          ? 'hover:bg-slate-50'
          : 'bg-brand-blue-50/50 hover:bg-brand-blue-50'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            notification.is_read
              ? 'text-slate-600'
              : 'text-slate-900 font-semibold'
          }`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-brand-blue-500 mt-2 flex-shrink-0" />
      )}
    </button>
  );
}
