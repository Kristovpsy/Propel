import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  eventDates: Set<string>;
}

export default function CalendarStrip({
  selectedDate,
  onSelectDate,
  eventDates,
}: CalendarStripProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate 14 days centered around selected week
  const days = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 3);
    const result: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      result.push(d);
    }
    return result;
  }, [selectedDate]);

  function toKey(d: Date) {
    return d.toISOString().split('T')[0];
  }

  function navigate(dir: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + dir * 7);
    onSelectDate(next);
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
      {/* Month + navigation */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectDate(today)}
            className="px-2.5 py-1 text-[11px] font-semibold text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date strip */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {days.map((day) => {
          const key = toKey(day);
          const isToday = key === toKey(today);
          const isSelected = key === toKey(selectedDate);
          const hasEvent = eventDates.has(key);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center min-w-[48px] py-2 px-1.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-brand-blue-600 text-white shadow-md'
                  : isToday
                    ? 'bg-brand-blue-50 text-brand-blue-700 ring-1 ring-brand-blue-200'
                    : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase ${
                  isSelected ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {dayNames[day.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">
                {day.getDate()}
              </span>
              {/* Event dot */}
              <div className="h-1.5">
                {hasEvent && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-brand-green-500'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
