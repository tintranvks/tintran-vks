import React from 'react';
import { CalendarEvent } from '../types/calendar';
import { PlayCircle, CheckCircle2, ArrowRight, Zap, Sparkles } from 'lucide-react';

interface HappeningNowBarProps {
  events: CalendarEvent[];
  currentTime: Date;
  onToggleComplete: (id: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onQuickAddEmergent: () => void;
}

export const HappeningNowBar: React.FC<HappeningNowBarProps> = ({
  events,
  currentTime,
  onToggleComplete,
  onSelectEvent,
  onQuickAddEmergent,
}) => {
  const todayStr = currentTime.toISOString().split('T')[0];
  const curMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Find events for today that are not completed
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find active event
  const activeEvent = todayEvents.find((e) => {
    if (e.completed) return false;
    const [sH, sM] = e.startTime.split(':').map(Number);
    const [eH, eM] = e.endTime.split(':').map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    return curMinutes >= startMin && curMinutes <= endMin;
  });

  // Find next upcoming event
  const nextEvent = todayEvents.find((e) => {
    if (e.completed) return false;
    const [sH, sM] = e.startTime.split(':').map(Number);
    const startMin = sH * 60 + sM;
    return startMin > curMinutes;
  });

  // Calculate progress of active event
  let progressPercent = 0;
  let remainingMinutes = 0;
  if (activeEvent) {
    const [sH, sM] = activeEvent.startTime.split(':').map(Number);
    const [eH, eM] = activeEvent.endTime.split(':').map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    const totalDuration = Math.max(1, endMin - startMin);
    const elapsed = curMinutes - startMin;
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    remainingMinutes = Math.max(0, endMin - curMinutes);
  }

  // Priority indicator color
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'high':
        return 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'medium':
        return 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10';
      default:
        return 'text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'P1 · Khẩn cấp';
      case 'high':
        return 'P2 · Ưu tiên cao';
      case 'medium':
        return 'P3 · Tiêu chuẩn';
      default:
        return 'P4 · Linh hoạt';
    }
  };

  return (
    <section className="px-3 md:px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
      {activeEvent ? (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                <span className="font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Đang diễn ra
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {activeEvent.startTime} – {activeEvent.endTime}
                </span>
                <span aria-hidden="true">·</span>
                <span className={`text-[11px] px-1.5 py-0.2 border rounded ${getPriorityStyle(activeEvent.priority)}`}>
                  {getPriorityLabel(activeEvent.priority)}
                </span>
                {activeEvent.isEmergent && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                    <Zap className="w-3 h-3 fill-current" />
                    Việc phát sinh
                  </span>
                )}
              </div>

              <button
                onClick={() => onSelectEvent(activeEvent)}
                className="text-left font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block max-w-full text-sm md:text-base"
              >
                {activeEvent.title}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 pl-6 lg:pl-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700/50 justify-between lg:justify-end">
            {/* Progress bar */}
            <div className="flex flex-col gap-1 w-36 sm:w-44">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Tiến độ ({progressPercent}%)</span>
                <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                  Còn {remainingMinutes} phút
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Complete Action */}
            <button
              onClick={() => onToggleComplete(activeEvent.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xong việc</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 px-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Không có sự kiện nào đang diễn ra tại thời điểm này.</span>
            {nextEvent && (
              <>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  Kế tiếp lúc <strong className="font-mono tabular-nums">{nextEvent.startTime}</strong>: &quot;{nextEvent.title}&quot;
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {nextEvent ? (
              <button
                onClick={() => onSelectEvent(nextEvent)}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <span>Xem sự kiện kế tiếp</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onQuickAddEmergent}
                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                <Sparkles className="w-3 h-3" />
                <span>Ghi nhận việc phát sinh mới</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
