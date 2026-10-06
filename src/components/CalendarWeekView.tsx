import React from 'react';
import { CalendarEvent } from '../types/calendar';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface CalendarWeekViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  events: CalendarEvent[];
  currentTime: Date;
  onSelectEvent: (event: CalendarEvent) => void;
  onSlotClick: (date: string, hour: number) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  selectedDate,
  onSelectDate,
  events,
  currentTime,
  onSelectEvent,
  onSlotClick,
}) => {
  const todayStr = currentTime.toISOString().split('T')[0];

  // Calculate Monday through Sunday for current week containing selectedDate
  const curr = new Date(selectedDate);
  const dayOfWeek = (curr.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      dayName: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
      dayNumber: d.getDate(),
      month: d.getMonth() + 1,
    };
  });

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleThisWeek = () => {
    onSelectDate(todayStr);
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800';
      case 'high':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
      case 'medium':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleThisWeek}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Tuần này
          </button>
          <div className="flex items-center">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">
            Tháng {weekDays[0].month} ({weekDays[0].dayNumber} - {weekDays[6].dayNumber}/{weekDays[6].month})
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Nhấp ô giờ bất kỳ để tạo nhanh lịch làm việc
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* Day Columns Header */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
            <div className="p-2 text-center text-xs text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800/80">
              Giờ
            </div>
            {weekDays.map((wd) => {
              const isToday = wd.date === todayStr;
              const isSelected = wd.date === selectedDate;
              return (
                <div
                  key={wd.date}
                  onClick={() => onSelectDate(wd.date)}
                  className={`p-2 text-center border-r border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors ${
                    isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{wd.dayName}</div>
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isSelected
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {wd.dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {hours.map((hour) => {
              const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                  {/* Time label */}
                  <div className="p-2 text-right text-xs font-mono tabular-nums text-slate-400 border-r border-slate-100 dark:border-slate-800/80 select-none">
                    {hourLabel}
                  </div>

                  {/* 7 Day slots */}
                  {weekDays.map((wd) => {
                    const slotEvents = events.filter((e) => {
                      if (e.date !== wd.date) return false;
                      const sH = parseInt(e.startTime.split(':')[0], 10);
                      return sH === hour;
                    });

                    return (
                      <div
                        key={wd.date}
                        onClick={() => onSlotClick(wd.date, hour)}
                        className="p-1 border-r border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors relative min-h-[58px]"
                      >
                        <div className="space-y-1">
                          {slotEvents.map((ev) => (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEvent(ev);
                              }}
                              className={`p-1.5 rounded text-[11px] font-medium border shadow-2xs truncate hover:opacity-90 ${getPriorityStyle(
                                ev.priority
                              )} ${ev.completed ? 'line-through opacity-60' : ''}`}
                              title={`${ev.startTime} - ${ev.title}`}
                            >
                              <div className="flex items-center gap-1">
                                {ev.isEmergent && <Zap className="w-2.5 h-2.5 shrink-0 fill-current text-amber-500" />}
                                <span className="font-mono tabular-nums text-[10px] opacity-80 shrink-0">
                                  {ev.startTime}
                                </span>
                                <span className="truncate">{ev.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
