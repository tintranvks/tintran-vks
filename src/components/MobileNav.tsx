import React from 'react';
import { CalendarViewMode } from '../types/calendar';
import { Clock, CalendarDays, Calendar as CalendarIcon, Zap, BarChart3, LayoutGrid } from 'lucide-react';

interface MobileNavProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  onOpenQuickAdd: (isEmergent?: boolean) => void;
  onBackToDashboard?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onViewChange,
  onOpenQuickAdd,
  onBackToDashboard,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onViewChange('day')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'day'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Ngày</span>
      </button>

      <button
        onClick={() => onViewChange('week')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'week'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span>Tuần</span>
      </button>

      {/* Floating Center Action Button */}
      <button
        onClick={() => onOpenQuickAdd(true)}
        className="flex items-center justify-center -mt-4 w-10 h-10 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-transform active:scale-95 shrink-0"
        title="Thêm nhanh việc phát sinh"
      >
        <Zap className="w-4 h-4 fill-current" />
      </button>

      <button
        onClick={() => onViewChange('month')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'month'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CalendarIcon className="w-4 h-4" />
        <span>Tháng</span>
      </button>

      <button
        onClick={() => onViewChange('analytics')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'analytics'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Thống kê</span>
      </button>

      <button
        onClick={onBackToDashboard}
        className="flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <LayoutGrid className="w-4 h-4 text-indigo-500" />
        <span>Dashboard</span>
      </button>
    </div>
  );
};

