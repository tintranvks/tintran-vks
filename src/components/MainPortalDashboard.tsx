import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode } from '../types/calendar';
import {
  LayoutGrid,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  BarChart3,
  HardDrive,
  Bell,
  CalendarDays,
  Calendar as CalendarIcon,
  Plus,
  ExternalLink,
  Trash2,
  Globe,
  AlertCircle
} from 'lucide-react';

export interface CustomUserTool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  createdAt: string;
}

interface MainPortalDashboardProps {
  events: CalendarEvent[];
  currentTime: Date;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  onOpenWorkManagement: (initialView?: CalendarViewMode) => void;
}

const STORAGE_CUSTOM_TOOLS_KEY = 'chronos_dashboard_user_tools';

export const MainPortalDashboard: React.FC<MainPortalDashboardProps> = ({
  events,
  currentTime,
  isDarkMode,
  onToggleTheme,
  isOnline,
  onOpenWorkManagement,
}) => {
  // Custom user-added tools list (Stored in localStorage)
  const [customTools, setCustomTools] = useState<CustomUserTool[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_TOOLS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolUrl, setNewToolUrl] = useState('');

  const handleSaveCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolUrl.trim()) return;

    const newTool: CustomUserTool = {
      id: `tool-${Date.now()}`,
      name: newToolName.trim(),
      description: newToolDesc.trim() || 'Công cụ tiện ích mở rộng',
      url: newToolUrl.trim().startsWith('http') ? newToolUrl.trim() : `https://${newToolUrl.trim()}`,
      category: 'Cá nhân',
      createdAt: new Date().toISOString(),
    };

    const updated = [newTool, ...customTools];
    setCustomTools(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_TOOLS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Lỗi lưu công cụ:', err);
    }

    setNewToolName('');
    setNewToolDesc('');
    setNewToolUrl('');
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomTool = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTools.filter((t) => t.id !== id);
    setCustomTools(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_TOOLS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Lỗi xóa công cụ:', err);
    }
  };

  // Time formatting
  const timeString = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Chronos Work Management live stats
  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.completed).length;
  const todayStr = currentTime.toISOString().split('T')[0];
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayCompleted = todayEvents.filter((e) => e.completed).length;
  const todayCritical = todayEvents.filter((e) => e.priority === 'critical' && !e.completed).length;
  const todayEmergent = todayEvents.filter((e) => e.isEmergent && !e.completed).length;
  const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Standalone Dashboard Topbar Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bảng Điều Khiển Trung Tâm</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                🟢 Hoạt Động
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Trung tâm điều phối ứng dụng và quản lý công việc số
            </p>
          </div>
        </div>

        {/* Real-time Clock & System Status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono tabular-nums font-semibold">{timeString}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span className="capitalize">{dateString}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Intro Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-800/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Không Gian Làm Việc Số</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Bảng Điều Khiển Lựa Chọn Công Cụ
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Chào mừng bạn đến với Bảng điều khiển. Chọn **Bộ Công Cụ Quản Lý Làm Việc (Chronos)** bên dưới để mở toàn bộ tính năng điều phối thời gian thực, quản lý lịch trình và việc phát sinh.
              </p>
            </div>

            <button
              onClick={() => onOpenWorkManagement('day')}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Calendar className="w-4 h-4" />
              <span>Vào Làm Việc Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRIMARY HERO CARD: BỘ CÔNG CỤ QUẢN LÝ LÀM VIỆC (CHRONOS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Công Cụ Đang Hoạt Động</span>
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              🟢 Sẵn Sàng Sử Dụng
            </span>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/60 dark:border-indigo-500/50 shadow-xl transition-all relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              {/* Header inside card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      Bộ Công Cụ Quản Lý Làm Việc & Lịch Trình (Chronos)
                    </h4>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                      Điều phối thời gian thực 24h · Ghi nhận việc phát sinh · Nhắc nhở thông minh · Phân tích Recharts
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenWorkManagement('day')}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm md:text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
                >
                  <span>Mở Bộ Công Cụ Quản Lý Công Việc</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Lịch hôm nay</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {todayEvents.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Đã hoàn thành {todayCompleted}/{todayEvents.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Tiến độ hoàn thành</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {completionRate}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Việc phát sinh</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {todayEmergent}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Đột xuất cần xử lý trong ngày
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Khẩn cấp P1</span>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                    {todayCritical}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Báo chuông pha lê ưu tiên
                  </div>
                </div>
              </div>

              {/* Direct Quick Launch Sub-Views */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Truy cập nhanh:
                </span>
                <button
                  onClick={() => onOpenWorkManagement('day')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Theo Ngày (24h)</span>
                </button>
                <button
                  onClick={() => onOpenWorkManagement('week')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Theo Tuần</span>
                </button>
                <button
                  onClick={() => onOpenWorkManagement('month')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Theo Tháng</span>
                </button>
                <button
                  onClick={() => onOpenWorkManagement('emergent')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-medium text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
                  <span>Việc Phát Sinh</span>
                </button>
                <button
                  onClick={() => onOpenWorkManagement('analytics')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Biểu Đồ Phân Tích (Recharts)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: CÁC CÔNG CỤ CỦA BẠN (CUSTOM TOOLS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>Công Cụ Khác Của Bạn</span>
              {customTools.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-mono">
                  {customTools.length}
                </span>
              )}
            </h3>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Liên Kết Công Cụ Mới</span>
            </button>
          </div>

          {customTools.length === 0 ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Chưa có thêm công cụ nào được liên kết
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Khi bạn tạo thêm các phần mềm, trang web hoặc ứng dụng khác, bạn có thể bấm nút &quot;Thêm Liên Kết Công Cụ Mới&quot; để tổng hợp tất cả vào Dashboard này.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm liên kết ứng dụng bạn tạo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => handleDeleteCustomTool(tool.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa công cụ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h5 className="text-base font-bold text-slate-900 dark:text-white">
                      {tool.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <span>Mở công cụ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: TỔNG QUAN TÍNH NĂNG CỐT LÕI */}
        <div className="space-y-4">
          <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Năng Lực Cốt Lõi Của Bộ Công Cụ Quản Lý Làm Việc</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Thời Gian Thực & Đang Diễn Ra
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Vạch đỏ định vị chính xác từng phút trên dòng thời gian 24 giờ. Thanh trạng thái đếm ngược hiển thị công việc đang diễn ra.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Xử Lý Việc Phát Sinh Đột Xuất
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ghi nhận nhanh chóng các nhiệm vụ phát sinh bất ngờ trong 1 giây mà không làm gián đoạn dòng chảy công việc của cả ngày.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nhắc Nhở Chuông Pha Lê (P1 - P4)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hệ thống âm thanh Web Audio tự tổng hợp chuông pha lê trong trẻo không cần mạng, phân cấp âm sắc theo 4 mức độ ưu tiên.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Dashboard Phân Tích Recharts
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Biểu đồ tròn (Pie Chart) phân loại danh mục và biểu đồ cột (Bar Chart) đo lường tiến độ hoàn thành từng ngày trong tuần.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Hệ Thống Sao Lưu Tự Nhiên
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tự động chụp snapshot định kỳ trong nền mà không làm gián đoạn thao tác của bạn. Phục hồi và xuất tệp JSON bất kỳ lúc nào.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Bảo Mật Đầu-Cuối & Đa Thiết Bị
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Chuẩn mã hóa AES-256-GCM bảo vệ quyền riêng tư tuyệt đối, hoạt động ngoại tuyến 100% và đồng bộ tức thì PC & Điện thoại.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Custom Tool Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              <span>Thêm Công Cụ Bạn Tạo</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhập thông tin phần mềm hoặc website bạn đã tạo để đưa vào Bảng điều khiển này.
            </p>

            <form onSubmit={handleSaveCustomTool} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Công Cụ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công Cụ Tính Toán Lương"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đường Dẫn (URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... hoặc tên miền web"
                  value={newToolUrl}
                  onChange={(e) => setNewToolUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô Tả Ngắn
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả công dụng chính..."
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-colors"
                >
                  Lưu Công Cụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
