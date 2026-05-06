import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import { fetchEvents } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import CalendarStrip from '../../components/events/CalendarStrip';
import EventCard from '../../components/events/EventCard';
import CreateEventModal from '../../components/events/CreateEventModal';
import { Calendar, Plus, Loader2 } from 'lucide-react';

type FilterTab = 'upcoming' | 'past' | 'all';

export default function EventsPage() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const isMentor = profile?.role === 'mentor';
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [filterTab, setFilterTab] = useState<FilterTab>('upcoming');

  async function loadEvents() {
    if (!profile?.id || !profile.role) return;
    setIsLoading(true);
    try {
      const data = await fetchEvents(profile.id, profile.role);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [profile?.id, profile?.role]);

  // Realtime subscription for live event updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`events-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Event dates for calendar dots
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.event_date);
      dates.add(d.toISOString().split('T')[0]);
    });
    return dates;
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = events;

    if (filterTab === 'upcoming') {
      filtered = filtered.filter((e) => new Date(e.event_date) >= now);
    } else if (filterTab === 'past') {
      filtered = filtered.filter((e) => new Date(e.event_date) < now);
    }

    // Filter by selected date - show events on that date
    const selectedKey = selectedDate.toISOString().split('T')[0];
    const hasEventsOnDate = filtered.some(
      (e) => new Date(e.event_date).toISOString().split('T')[0] === selectedKey
    );

    if (hasEventsOnDate) {
      filtered = filtered.filter(
        (e) =>
          new Date(e.event_date).toISOString().split('T')[0] === selectedKey
      );
    }

    return filtered;
  }, [events, filterTab, selectedDate]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Events
          </h1>
          <p className="text-slate-500 ml-[52px]">
            {isMentor
              ? 'Schedule sessions with your mentees.'
              : 'View and RSVP to sessions with your mentors.'}
          </p>
        </div>

        {isMentor && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Calendar strip */}
      <div className="mb-6">
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventDates={eventDates}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterTab === tab.key
                ? 'bg-brand-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userId={profile!.id}
              isMentor={isMentor}
              onUpdate={loadEvents}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No events</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            {isMentor
              ? 'Create your first event to schedule a session.'
              : 'Events from your mentors will appear here.'}
          </p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && profile && (
        <CreateEventModal
          mentorId={profile.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
