import React, { useRef, useEffect } from 'react';
import { CalendarEvent } from '../types/calendar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Plus
} from 'lucide-react';

interface CalendarDayViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  events: CalendarEvent[];
  currentTime: Date;
  onSelectEvent: (event: CalendarEvent) => void;
  onSlotClick: (date: string, hour: number) => void;
  onToggleComplete: (id: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  selectedDate,
  onSelectDate,
  events,
  currentTime,
  onSelectEvent,
  onSlotClick,
  onToggleComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const isToday = currentTime.toISOString().split('T')[0] === selectedDate;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Filter events for the selected day
  const dayEvents = events.filter((e) => e.date === selectedDate);

  // Auto-scroll to current hour on initial mount if viewing today
  useEffect(() => {
    if (isToday && containerRef.current) {
      const curHour = currentTime.getHours();
      const targetScroll = Math.max(0, (curHour - 2) * 64);
      containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [selectedDate, isToday]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onSelectDate(currentTime.toISOString().split('T')[0]);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-rose-500 bg-rose-50/80 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-900/50';
      case 'high':
        return 'border-l-4 border-l-amber-500 bg-amber-50/80 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-900/50';
      case 'medium':
        return 'border-l-4 border-l-sky-500 bg-sky-50/80 dark:bg-sky-950/20 text-sky-900 dark:text-sky-100 border-sky-200 dark:border-sky-900/50';
      default:
        return 'border-l-4 border-l-slate-400 bg-slate-50/80 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isToday
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Hôm nay
          </button>
          <div className="flex items-center">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Ngày tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-white capitalize">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
            {dayEvents.length} sự kiện
          </span>
          <span aria-hidden="true">·</span>
          <span>{dayEvents.filter((e) => e.completed).length} đã xong</span>
        </div>
      </div>

      {/* 24-Hour Timeline */}
      <div ref={containerRef} className="flex-1 overflow-y-auto relative min-h-[500px]">
        {/* Real-time Indicator Line if today */}
        {isToday && (
          <div
            className="absolute left-14 md:left-20 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: `${(currentMinutes / 60) * 64}px` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 ring-4 ring-rose-500/20" />
            <div className="h-0.5 bg-rose-500 flex-1 shadow-xs" />
          </div>
        )}

        <div className="relative">
          {hours.map((hour) => {
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

            // Filter events that start within this hour slot
            const slotEvents = dayEvents.filter((e) => {
              const startH = parseInt(e.startTime.split(':')[0], 10);
              return startH === hour;
            });

            return (
              <div
                key={hour}
                className="group relative flex border-b border-slate-100 dark:border-slate-800/80 min-h-[64px]"
              >
                {/* Time ruler column */}
                <div className="w-14 md:w-20 shrink-0 px-2 md:px-4 py-2 text-right border-r border-slate-100 dark:border-slate-800/80 select-none">
                  <span className="font-mono tabular-nums text-xs font-medium text-slate-400 dark:text-slate-500">
                    {timeLabel}
                  </span>
                </div>

                {/* Timeline slot canvas */}
                <div
                  onClick={() => onSlotClick(selectedDate, hour)}
                  className="flex-1 relative p-1.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                >
                  {/* Subtle slot hover add cue */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-end pr-4 pointer-events-none transition-opacity">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> Nhấp để tạo lịch
                    </span>
                  </div>

                  {/* Render events starting in this hour */}
                  <div className="space-y-1.5 relative z-10">
                    {slotEvents.map((event) => {
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className={`p-2.5 rounded-lg border shadow-xs transition-all hover:shadow-md cursor-pointer ${getPriorityBorder(
                            event.priority
                          )} ${event.completed ? 'opacity-60 line-through' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap text-xs mb-1">
                                <span className="font-mono tabular-nums font-semibold">
                                  {event.startTime} - {event.endTime}
                                </span>
                                {event.isEmergent && (
                                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 text-[11px] font-semibold">
                                    <Zap className="w-3 h-3 fill-current" />
                                    Phát sinh
                                  </span>
                                )}
                                {event.priority === 'critical' && (
                                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5 text-[11px] font-semibold">
                                    <AlertCircle className="w-3 h-3" />
                                    Khẩn cấp
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-sm truncate">{event.title}</p>
                              {event.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                  {event.description}
                                </p>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Checkbox button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(event.id);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                event.completed
                                  ? 'text-emerald-600 hover:text-emerald-700'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                              title={event.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
