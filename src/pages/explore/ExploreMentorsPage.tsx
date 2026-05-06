import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, Compass, Users } from 'lucide-react';
import MentorCard from '../../components/mentors/MentorCard';
import { useMentors } from '../../lib/hooks';
import type { MentorSearchFilters } from '../../lib/api';

const POPULAR_TAGS = [
  'Software Engineering', 'Product Design', 'Data Science', 'Product Management',
  'AI/ML', 'Leadership', 'Frontend Development', 'Backend Development',
  'Cloud Architecture', 'UX Research', 'DevOps', 'Mobile Development',
  'Entrepreneurship', 'Career Transitions', 'Marketing', 'System Design',
];

export default function ExploreMentorsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: MentorSearchFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      availableOnly,
    }),
    [debouncedSearch, selectedTags, availableOnly]
  );

  const { data: mentors, isLoading, error } = useMentors(filters);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearFilters() {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedTags([]);
    setAvailableOnly(false);
  }

  const hasActiveFilters =
    searchInput.length > 0 || selectedTags.length > 0 || availableOnly;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          Explore Mentors
        </h1>
        <p className="text-slate-500 ml-[52px]">
          Discover mentors who match your goals and interests.
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, bio, or expertise..."
              className="input-field pl-10"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center gap-2 border border-slate-200 rounded-xl px-4 ${
              showFilters || hasActiveFilters
                ? 'border-brand-blue-300 text-brand-blue-600 bg-brand-blue-50'
                : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-brand-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {selectedTags.length + (availableOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
            {/* Availability toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-green-600 focus:ring-brand-green-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Available mentors only
                </span>
                <Users className="w-3.5 h-3.5 text-emerald-500" />
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-red-500 font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Tag chips */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Filter by expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        isSelected
                          ? 'bg-brand-blue-600 text-white border-brand-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-blue-400 hover:text-brand-blue-600 hover:bg-brand-blue-50'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active filter pills (shown above results) */}
      {selectedTags.length > 0 && !showFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Filtered by:</span>
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="badge-blue flex items-center gap-1 pl-2.5 pr-1.5 py-1"
            >
              {tag}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                  <div className="h-5 bg-slate-100 rounded-full w-20" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
              <div className="flex gap-1.5">
                <div className="h-6 bg-slate-100 rounded-full w-16" />
                <div className="h-6 bg-slate-100 rounded-full w-20" />
                <div className="h-6 bg-slate-100 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-600 font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : mentors && mentors.length > 0 ? (
        <>
          <p className="text-sm text-slate-400 mb-4 font-medium">
            {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No mentors found
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'No mentors have completed onboarding yet. Check back soon!'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm">
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
