import React from 'react';
import { CalendarEvent, Category, Priority, CalendarViewMode } from '../types/calendar';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Users, 
  Target, 
  User, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Database,
  BarChart3,
  LayoutGrid
} from 'lucide-react';

interface SidebarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  events: CalendarEvent[];
  selectedCategory: Category | 'all';
  onSelectCategory: (cat: Category | 'all') => void;
  onQuickAddEmergent: () => void;
  currentTime: Date;
  currentView?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  onBackToDashboard?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDate,
  onSelectDate,
  events,
  selectedCategory,
  onSelectCategory,
  onQuickAddEmergent,
  currentTime,
  currentView,
  onViewChange,
  onBackToDashboard,
}) => {
  const todayStr = currentTime.toISOString().split('T')[0];
  const curDateObj = new Date(selectedDate);
  const year = curDateObj.getFullYear();
  const month = curDateObj.getMonth();

  // Mini Calendar calculations
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = lastDay.getDate();

  const handlePrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  // Stats for today
  const todayEvents = events.filter((e) => e.date === todayStr);
  const criticalCount = todayEvents.filter((e) => e.priority === 'critical' && !e.completed).length;
  const emergentCount = todayEvents.filter((e) => e.isEmergent && !e.completed).length;
  const completedCount = todayEvents.filter((e) => e.completed).length;

  const categories: { key: Category | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tất cả danh mục', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { key: 'work', label: 'Công việc', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { key: 'meeting', label: 'Cuộc họp', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'emergent', label: 'Việc phát sinh', icon: <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" /> },
    { key: 'focus', label: 'Tập trung chuyên sâu', icon: <Target className="w-3.5 h-3.5" /> },
    { key: 'personal', label: 'Cá nhân', icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 hidden md:flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {/* Back to Master Dashboard */}
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all border cursor-pointer bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            title="Quay về Bảng điều khiển chọn công cụ"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>⬅ Bảng Điều Khiển Tổng</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Dashboard
            </span>
          </button>
        )}

        {/* Rapid Emergent Action */}
        <button
          onClick={onQuickAddEmergent}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-2xs cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current text-amber-500" />
          <span>+ Ghi nhận việc phát sinh</span>
        </button>

        {/* Analytics Trigger */}
        {onViewChange && (
          <button
            onClick={() => onViewChange('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Phân Tích & Sao Lưu</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Recharts
            </span>
          </button>
        )}

        {/* Mini Calendar Widget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>
              Tháng {month + 1}, {year}
            </span>
            <div className="flex items-center">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-[11px] text-center font-semibold text-slate-400">
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div>T7</div>
            <div>CN</div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-6" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum
                .toString()
                .padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasEvents = events.some((e) => e.date === dateStr);

              return (
                <button
                  key={dayNum}
                  onClick={() => onSelectDate(dateStr)}
                  className={`h-6 w-6 mx-auto rounded-full text-[11px] flex items-center justify-center font-medium transition-colors relative ${
                    isToday
                      ? 'bg-indigo-600 text-white font-bold'
                      : isSelected
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {dayNum}
                  {hasEvents && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Dashboard Metrics */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tổng quan hôm nay
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Khẩn cấp P1 chưa xong
              </span>
              <span className="font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                {criticalCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Việc phát sinh trong ngày
              </span>
              <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                {emergentCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Đã hoàn thành
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Lọc theo danh mục
          </div>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => onSelectCategory(c.key)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left ${
                selectedCategory === c.key
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3 text-emerald-500" />
          <span>IndexedDB Ngoại tuyến</span>
        </span>
        <span className="font-mono text-[10px]">v1.0.0</span>
      </div>
    </aside>
  );
};
