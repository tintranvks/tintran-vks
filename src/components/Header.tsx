import React from 'react';
import { CalendarViewMode, SecurityStatus } from '../types/calendar';
import { SyncState } from '../services/sync';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  Clock, 
  Bell, 
  Shield, 
  ShieldCheck, 
  RefreshCw, 
  Sun, 
  Moon, 
  Plus, 
  Zap,
  Wifi,
  WifiOff,
  Cloud,
  Search,
  BarChart3,
  LayoutGrid
} from 'lucide-react';

interface HeaderProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  onOpenQuickAdd: (isEmergent?: boolean) => void;
  onOpenSync: () => void;
  onOpenSecurity: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onBackToDashboard?: () => void;
  unreadNotificationsCount: number;
  securityStatus: SecurityStatus;
  isOnline: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentTime: Date;
  syncState: SyncState;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenQuickAdd,
  onOpenSync,
  onOpenSecurity,
  onOpenNotifications,
  onOpenSearch,
  onBackToDashboard,
  unreadNotificationsCount,
  securityStatus,
  isOnline,
  isDarkMode,
  onToggleTheme,
  currentTime,
  syncState,
}) => {
  // Format real-time clock
  const timeString = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateString = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {/* Zone 1: Single Wordmark Brand & Back to Dashboard */}
      <div className="flex items-center gap-3">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shrink-0"
            title="Quay lại Bảng điều khiển chọn công cụ"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">⬅ Bảng Điều Khiển Tổng</span>
            <span className="sm:hidden">⬅ Dashboard</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Chronos
          </span>
        </div>

        {/* Real-time Live Clock & Network Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
            {timeString}
          </span>
          <span aria-hidden="true">·</span>
          <span>{dateString}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Đang trực tuyến">
                <Wifi className="w-3 h-3" />
                <span className="text-[11px]">Trực tuyến</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Chế độ ngoại tuyến (dữ liệu lưu cục bộ)">
                <WifiOff className="w-3 h-3" />
                <span className="text-[11px]">Ngoại tuyến</span>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / View Selectors */}
      <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
        <button
          onClick={() => onViewChange('day')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentView === 'day'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Theo Ngày</span>
        </button>

        <button
          onClick={() => onViewChange('week')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentView === 'week'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Theo Tuần</span>
        </button>

        <button
          onClick={() => onViewChange('month')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentView === 'month'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Theo Tháng</span>
        </button>

        <button
          onClick={() => onViewChange('emergent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentView === 'emergent'
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Việc Phát Sinh</span>
        </button>

        <button
          onClick={() => onViewChange('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentView === 'analytics'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Phân Tích</span>
        </button>
      </nav>

      {/* Global Search Bar Trigger with Ctrl+K shortcut */}
      <button
        onClick={onOpenSearch}
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 w-28 sm:w-44 md:w-56 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-lg transition-all cursor-pointer text-left"
        title="Tìm kiếm sự kiện, ghi chú, thẻ hoặc ngày (Ctrl+K)"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate hidden sm:inline">Tìm kiếm sự kiện...</span>
          <span className="truncate sm:hidden">Tìm kiếm...</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs shrink-0">
          <span className="text-[9px]">Ctrl</span> K
        </kbd>
      </button>

      {/* Zone 3: Actions (1-2 primary CTAs + system tools) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Rapid Emergent Event Button */}
        <button
          onClick={() => onOpenQuickAdd(true)}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
          title="Thêm nhanh sự kiện phát sinh đột xuất trong ngày"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Việc phát sinh</span>
        </button>

        {/* Primary Add Event Button */}
        <button
          onClick={() => onOpenQuickAdd(false)}
          className="flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-xs shadow-indigo-600/30 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm lịch</span>
        </button>

        {/* Security Vault Trigger */}
        <button
          onClick={onOpenSecurity}
          className={`p-1.5 md:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative ${
            securityStatus.isUnlocked && securityStatus.isEncryptionConfigured
              ? 'text-emerald-600 dark:text-emerald-400'
              : ''
          }`}
          title={
            securityStatus.isEncryptionConfigured
              ? securityStatus.isUnlocked
                ? 'Bảo mật AES-256 đang mở'
                : 'Kho bảo mật đang khóa'
              : 'Thiết lập mã hóa AES-256'
          }
        >
          {securityStatus.isUnlocked && securityStatus.isEncryptionConfigured ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
        </button>

        {/* Multi-Device Sync Trigger with Live Status */}
        <button
          onClick={onOpenSync}
          className={`p-1.5 md:p-2 rounded-lg transition-colors flex items-center gap-1.5 relative ${
            syncState === 'syncing'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
              : syncState === 'synced'
              ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={
            syncState === 'synced'
              ? 'Đã đồng bộ tự động thời gian thực (SSE & Đám mây)'
              : syncState === 'syncing'
              ? 'Đang tự động đồng bộ...'
              : 'Ngoại tuyến (Lưu trữ cục bộ)'
          }
        >
          <RefreshCw className={`w-4 h-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
          {syncState === 'synced' && (
            <span className="hidden xl:inline text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Đồng bộ
            </span>
          )}
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenNotifications}
          className="p-1.5 md:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Thông báo & Nhắc nhở thông minh"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        {/* Dark / Light Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 md:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
