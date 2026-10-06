import React from 'react';
import { CalendarEvent } from '../types/calendar';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface CalendarMonthViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  events: CalendarEvent[];
  currentTime: Date;
  onSelectEvent: (event: CalendarEvent) => void;
  onSwitchToDayView: (date: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  selectedDate,
  onSelectDate,
  events,
  currentTime,
  onSelectEvent,
  onSwitchToDayView,
}) => {
  const todayStr = currentTime.toISOString().split('T')[0];

  const currentDateObj = new Date(selectedDate);
  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth(); // 0-11

  const handlePrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleThisMonth = () => {
    onSelectDate(todayStr);
  };

  // Get calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  // Days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    days.push({
      dateStr: prevDate.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    const curDate = new Date(year, month, i);
    days.push({
      dateStr: curDate.toISOString().split('T')[0],
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Remaining slots to complete 35 or 42 grid items
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      dateStr: nextDate.toISOString().split('T')[0],
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const monthName = new Date(year, month).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleThisMonth}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Tháng này
          </button>
          <div className="flex items-center">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-white capitalize">
            {monthName}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Nhấp đôi hoặc nhấp số ngày để xem chi tiết lịch làm việc 24h
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center py-2">
        <div>Thứ 2</div>
        <div>Thứ 3</div>
        <div>Thứ 4</div>
        <div>Thứ 5</div>
        <div>Thứ 6</div>
        <div>Thứ 7</div>
        <div>Chủ Nhật</div>
      </div>

      {/* Month Days Matrix */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto">
        {days.map((d) => {
          const isToday = d.dateStr === todayStr;
          const isSelected = d.dateStr === selectedDate;
          const dayEvents = events.filter((e) => e.date === d.dateStr);

          return (
            <div
              key={d.dateStr}
              onClick={() => onSelectDate(d.dateStr)}
              onDoubleClick={() => onSwitchToDayView(d.dateStr)}
              className={`p-1.5 md:p-2 min-h-[90px] flex flex-col justify-between transition-colors cursor-pointer group ${
                !d.isCurrentMonth
                  ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
              } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d.dayNum}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                    {dayEvents.length} việc
                  </span>
                )}
              </div>

              {/* Event preview dots/chips */}
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className={`text-[11px] truncate px-1 py-0.5 rounded font-medium flex items-center gap-1 ${
                      ev.priority === 'critical'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : ev.priority === 'high'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    } ${ev.completed ? 'line-through opacity-50' : ''}`}
                  >
                    {ev.isEmergent && <Zap className="w-2.5 h-2.5 shrink-0 text-amber-500 fill-current" />}
                    <span className="font-mono tabular-nums text-[10px] opacity-75">{ev.startTime}</span>
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-slate-400 font-medium text-center">
                    +{dayEvents.length - 3} sự kiện nữa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
