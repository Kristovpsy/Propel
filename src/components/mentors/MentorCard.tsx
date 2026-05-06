import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import type { MentorWithProfile } from '../../lib/api';

interface MentorCardProps {
  mentor: MentorWithProfile;
  compact?: boolean;
}

export default function MentorCard({ mentor, compact = false }: MentorCardProps) {
  const mp = mentor.mentor_profiles?.[0];
  const tags = mp?.expertise_tags || [];
  const avgRating = mentor.avg_rating || 0;
  const reviewCount = mentor.review_count || 0;
  const isAtCapacity = mp?.is_at_capacity ?? false;

  return (
    <Link
      to={`/mentor/${mentor.id}`}
      className="group block bg-white rounded-2xl shadow-card border border-slate-100 hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Card content */}
      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Top section: avatar + name */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {mentor.avatar_url ? (
              <img
                src={mentor.avatar_url}
                alt={mentor.full_name}
                className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-full object-cover ring-2 ring-white shadow-sm`}
              />
            ) : (
              <div className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold ${compact ? 'text-base' : 'text-lg'} ring-2 ring-white shadow-sm`}>
                {mentor.full_name?.charAt(0) || '?'}
              </div>
            )}
            {/* Capacity indicator dot */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                isAtCapacity ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {mentor.full_name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {avgRating > 0 ? (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(avgRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {avgRating.toFixed(1)} ({reviewCount})
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">No reviews yet</span>
              )}
            </div>

            {/* Capacity badge */}
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

        {/* Bio preview */}
        {!compact && mp?.bio && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {mp.bio}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, compact ? 3 : 4).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-blue-50 text-brand-blue-600 border border-brand-blue-100"
            >
              {tag}
            </span>
          ))}
          {tags.length > (compact ? 3 : 4) && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100">
              +{tags.length - (compact ? 3 : 4)}
            </span>
          )}
        </div>

        {/* Mentorship style */}
        {!compact && mp?.mentorship_style && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Style: </span>
            <span className="text-xs text-slate-600 font-medium">{mp.mentorship_style}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
