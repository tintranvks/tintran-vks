import React, { useState, useEffect } from 'react';
import { CalendarEvent, Category } from '../types/calendar';
import { naturalBackupService, NaturalBackupSnapshot } from '../services/naturalBackup';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle,
  HardDrive,
  Download,
  RotateCcw,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
  currentTime: Date;
  selectedDate: string;
  onRestoreSnapshot: (events: CalendarEvent[]) => void;
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bgClass: string }> = {
  work: { label: 'Công việc', color: '#6366F1', bgClass: 'bg-indigo-500' },
  meeting: { label: 'Cuộc họp', color: '#10B981', bgClass: 'bg-emerald-500' },
  emergent: { label: 'Việc phát sinh', color: '#F59E0B', bgClass: 'bg-amber-500' },
  focus: { label: 'Tập trung sâu', color: '#0EA5E9', bgClass: 'bg-sky-500' },
  personal: { label: 'Cá nhân', color: '#8B5CF6', bgClass: 'bg-purple-500' },
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  events,
  currentTime,
  selectedDate,
  onRestoreSnapshot,
}) => {
  const [snapshots, setSnapshots] = useState<NaturalBackupSnapshot[]>(() =>
    naturalBackupService.getSnapshots()
  );
  const [toastMsg, setToastMsg] = useState('');
  // Week offset relative to selectedDate (0 = this week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Subscribe to natural backup updates
  useEffect(() => {
    const unsub = naturalBackupService.subscribe((updated) => {
      setSnapshots(updated);
    });
    return unsub;
  }, []);

  // 1. Calculations for Category Pie Chart
  const categoryCounts: Record<Category, number> = {
    work: 0,
    meeting: 0,
    emergent: 0,
    focus: 0,
    personal: 0,
  };

  events.forEach((ev) => {
    if (categoryCounts[ev.category] !== undefined) {
      categoryCounts[ev.category]++;
    } else {
      categoryCounts.work++;
    }
  });

  const totalEventCount = events.length;

  const pieData = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([catKey, count]) => {
      const cfg = CATEGORY_CONFIG[catKey as Category];
      const pct = totalEventCount > 0 ? Math.round((count / totalEventCount) * 100) : 0;
      return {
        name: cfg.label,
        category: catKey,
        value: count,
        percentage: pct,
        color: cfg.color,
      };
    });

  // 2. Calculations for Weekly Progress Bar Chart
  const baseDate = new Date(selectedDate);
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const dayOfWeek = (baseDate.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - dayOfWeek);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekDayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  let weekTotalCompleted = 0;
  let weekTotalEvents = 0;

  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayEvents = events.filter((e) => e.date === dateStr);
    const completed = dayEvents.filter((e) => e.completed).length;
    const pending = dayEvents.filter((e) => !e.completed).length;

    weekTotalCompleted += completed;
    weekTotalEvents += dayEvents.length;

    return {
      day: weekDayLabels[i],
      date: dateStr,
      'Đã hoàn thành': completed,
      'Đang chờ': pending,
      total: dayEvents.length,
      completionRate: dayEvents.length > 0 ? Math.round((completed / dayEvents.length) * 100) : 0,
    };
  });

  const weekCompletionRate =
    weekTotalEvents > 0 ? Math.round((weekTotalCompleted / weekTotalEvents) * 100) : 0;

  // Format week range label: DD/MM - DD/MM/YYYY
  const formatShortDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  const weekRangeLabel = `${formatShortDate(monday)} - ${formatShortDate(sunday)}/${sunday.getFullYear()}`;

  // KPI Overall Metrics
  const totalCompleted = events.filter((e) => e.completed).length;
  const overallRate = totalEventCount > 0 ? Math.round((totalCompleted / totalEventCount) * 100) : 0;
  const totalEmergent = events.filter((e) => e.isEmergent).length;
  const totalCritical = events.filter((e) => e.priority === 'critical').length;

  const handleManualBackup = () => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const snap = naturalBackupService.createSnapshot(
      events,
      `Sao lưu tức thời lúc ${timeStr}`
    );
    setSnapshots([snap, ...snapshots.filter((s) => s.id !== snap.id)]);
    showToast('Đã tạo một bản sao lưu tự nhiên thành công!');
  };

  const handleRestore = (snap: NaturalBackupSnapshot) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn phục hồi lịch công việc về bản sao "${snap.label}" với ${snap.eventCount} sự kiện?`
      )
    ) {
      onRestoreSnapshot(snap.events);
      showToast('Đã phục hồi lịch trình từ bản sao lưu thành công!');
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    naturalBackupService.deleteSnapshot(id);
    showToast('Đã xóa bản sao lưu');
  };

  const handleDownloadSnapshot = (snap: NaturalBackupSnapshot) => {
    const jsonStr = JSON.stringify(snap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_natural_backup_${snap.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const lastBackupTime = naturalBackupService.getLastBackupTime();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/70 dark:bg-slate-900/70">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-16 right-6 z-50 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Dashboard Phân Tích & Sao Lưu Tự Nhiên
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân loại sự kiện Recharts, đo lường tiến độ hoàn thành tuần và quản lý các bản snapshot tự nhiên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Sao lưu tự nhiên ngay</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Completion Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Tỷ lệ hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {overallRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({totalCompleted}/{totalEventCount})
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Events */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Tổng số sự kiện</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalEventCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Đồng bộ đa thiết bị</span>
          </div>
        </div>

        {/* Card 3: Emergent Events */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Việc phát sinh</span>
            <Zap className="w-4 h-4 text-amber-500 fill-current" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {totalEmergent}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Chiếm {totalEventCount > 0 ? Math.round((totalEmergent / totalEventCount) * 100) : 0}% tổng việc
          </div>
        </div>

        {/* Card 4: Critical Priority */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Khẩn cấp P1</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {totalCritical}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cảnh báo chuông pha lê ưu tiên
          </div>
        </div>
      </div>

      {/* Main Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution (Pie Chart using Recharts) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Phân Loại Sự Kiện Theo Danh Mục (Pie Chart)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cơ cấu công việc, cuộc họp, việc phát sinh và tập trung
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
              Tổng: {totalEventCount}
            </span>
          </div>

          <div className="h-64 w-full flex-1 min-h-[260px] relative">
            {pieData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                <PieChartIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span>Chưa có dữ liệu sự kiện để hiển thị biểu đồ tròn</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(51, 65, 85, 0.8)',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(val: unknown, name: unknown) => [
                      `${val} sự kiện (${Math.round((Number(val) / (totalEventCount || 1)) * 100)}%)`,
                      String(name),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Details Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const count = categoryCounts[key as Category] || 0;
              const pct = totalEventCount > 0 ? Math.round((count / totalEventCount) * 100) : 0;

              return (
                <div
                  key={key}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white pl-1">
                    {count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Weekly Progress (Bar Chart using Recharts) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Tiến Độ Hoàn Thành Theo Ngày Trong Tuần (Bar Chart)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                So sánh số sự kiện đã hoàn thành và đang chờ xử lý từng ngày
              </p>
            </div>

            {/* Week Switcher Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 transition-colors"
                title="Tuần trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Về tuần hiện tại"
              >
                {weekRangeLabel}
              </button>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 transition-colors"
                title="Tuần sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Week summary badge */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>
              Tổng trong tuần:{' '}
              <strong className="text-slate-900 dark:text-white font-mono">{weekTotalEvents}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Đã hoàn thành:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {weekTotalCompleted}
              </strong>{' '}
              ({weekCompletionRate}%)
            </span>
          </div>

          <div className="h-64 w-full flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1', opacity: 0.2 }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(val: unknown, name: unknown) => [`${val} sự kiện`, String(name)]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar dataKey="Đã hoàn thành" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Đang chờ" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Natural Auto-Backup Management Section (Hệ Thống Sao Lưu Tự Nhiên) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hệ Thống Sao Lưu Tự Nhiên (Natural Auto-Backup)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tự Động & Không Làm Phiền
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động chụp snapshot định kỳ trong nền, bảo vệ toàn vẹn dữ liệu ngoại tuyến và đa thiết bị
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tự nhiên hoạt động
            </span>
            {lastBackupTime && (
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                Gần nhất: {new Date(lastBackupTime).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        {/* Snapshots Table / List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Danh sách các bản sao lưu tự nhiên gần nhất ({snapshots.length} bản snapshot):</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Lưu trữ tối đa 15 snapshot gần nhất
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <HardDrive className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Chưa có bản snapshot tự nhiên nào.</p>
              <button
                onClick={handleManualBackup}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>Nhấn để tạo bản snapshot tự nhiên ngay</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40">
              {snapshots.map((snap) => {
                const dateObj = new Date(snap.timestamp);
                const dateStr = dateObj.toLocaleDateString('vi-VN');
                const timeStr = dateObj.toLocaleTimeString('vi-VN');

                return (
                  <div
                    key={snap.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {snap.label}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>
                            {timeStr} · {dateStr}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {snap.eventCount} sự kiện
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestore(snap)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                        title="Khôi phục lịch về thời điểm bản sao lưu này"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Phục hồi</span>
                      </button>

                      <button
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Tải tệp JSON bản snapshot này"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Xóa bản snapshot này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
