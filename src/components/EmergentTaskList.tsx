import React, { useState } from 'react';
import { CalendarEvent, Priority } from '../types/calendar';
import { 
  Zap, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Calendar, 
  Sparkles, 
  MapPin,
  CheckSquare,
  Square,
  X,
  Check
} from 'lucide-react';

interface EmergentTaskListProps {
  events: CalendarEvent[];
  selectedDate: string;
  currentTime: Date;
  onToggleComplete: (id: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteBatch: (ids: string[]) => void;
  onBatchComplete?: (ids: string[], completed: boolean) => void;
  onQuickAdd: (title: string, priority: Priority, isEmergent: boolean) => void;
}

export const EmergentTaskList: React.FC<EmergentTaskListProps> = ({
  events,
  selectedDate,
  currentTime,
  onToggleComplete,
  onSelectEvent,
  onDeleteEvent,
  onDeleteBatch,
  onBatchComplete,
  onQuickAdd,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('high');
  const [filterType, setFilterType] = useState<'all' | 'emergent' | 'critical' | 'pending' | 'completed'>('emergent');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const todayStr = currentTime.toISOString().split('T')[0];
  const curMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Filter today's events or matching selected date
  const filteredEvents = events.filter((ev) => {
    const matchDate = ev.date === selectedDate;
    if (!matchDate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = ev.title.toLowerCase().includes(q) || (ev.description && ev.description.toLowerCase().includes(q));
      if (!matchText) return false;
    }

    if (filterType === 'emergent') return ev.isEmergent;
    if (filterType === 'critical') return ev.priority === 'critical';
    if (filterType === 'pending') return !ev.completed;
    if (filterType === 'completed') return ev.completed;
    return true;
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAdd(quickInput.trim(), quickPriority, true);
    setQuickInput('');
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleExecuteBatchDelete = () => {
    if (selectedIds.size === 0) return;
    onDeleteBatch(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowConfirmDelete(false);
    setIsSelectionMode(false);
  };

  const handleBatchMarkComplete = (completed: boolean) => {
    if (selectedIds.size === 0 || !onBatchComplete) return;
    onBatchComplete(Array.from(selectedIds), completed);
    setSelectedIds(new Set());
  };

  const priorityOrder: Priority[] = ['critical', 'high', 'medium', 'low'];

  const getPriorityHeading = (priority: Priority) => {
    switch (priority) {
      case 'critical':
        return { label: 'P1 · Khẩn cấp & Trọng yếu', badgeColor: 'bg-rose-500 text-white' };
      case 'high':
        return { label: 'P2 · Ưu tiên cao', badgeColor: 'bg-amber-500 text-white' };
      case 'medium':
        return { label: 'P3 · Tiêu chuẩn', badgeColor: 'bg-sky-500 text-white' };
      case 'low':
        return { label: 'P4 · Linh hoạt', badgeColor: 'bg-slate-400 text-white' };
    }
  };

  const isAllSelected = filteredEvents.length > 0 && selectedIds.size === filteredEvents.length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto relative">
      {/* Top Banner & Quick Capture Box */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-current" />
              Sự Kiện & Việc Phát Sinh Trong Ngày
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Điều phối tức thời các cuộc họp đột xuất, sự cố cấp bách và nhiệm vụ mới nảy sinh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSelectionMode) {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isSelectionMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'Thoát chọn nhiều' : 'Chế độ chọn nhiều'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedDate}</span>
            </div>
          </div>
        </div>

        {/* Rapid Add Form */}
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Nhập việc phát sinh mới... (ví dụ: Họp gấp với ban quản lý, Sửa lỗi máy chủ)"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as Priority)}
              className="px-3 py-2.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="critical">🔴 P1 · Khẩn cấp</option>
              <option value="high">🟠 P2 · Ưu tiên cao</option>
              <option value="medium">🔵 P3 · Tiêu chuẩn</option>
              <option value="low">⚪ P4 · Linh hoạt</option>
            </select>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs shadow-amber-600/30 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận ngay</span>
            </button>
          </div>
        </form>
      </div>

      {/* Floating / Sticky Batch Action Bar when Selection Mode is Active */}
      {isSelectionMode && (
        <div className="sticky top-0 z-20 px-4 md:px-6 py-2.5 bg-indigo-50/95 dark:bg-indigo-950/90 backdrop-blur-md border-b border-indigo-200 dark:border-indigo-900 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200 hover:underline"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filteredEvents.length})`}</span>
            </button>

            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-mono font-medium">
              Đã chọn: <strong>{selectedIds.size}</strong> / {filteredEvents.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                {onBatchComplete && (
                  <button
                    onClick={() => handleBatchMarkComplete(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-2xs"
                    title="Đánh dấu đã hoàn thành cho các sự kiện đã chọn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Xong ({selectedIds.size})</span>
                  </button>
                )}

                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-2xs"
                  title="Xóa vĩnh viễn các sự kiện đã chọn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hàng loạt ({selectedIds.size})</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              title="Đóng chế độ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('emergent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'emergent'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Chỉ việc phát sinh ({events.filter((e) => e.date === selectedDate && e.isEmergent).length})
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả trong ngày ({events.filter((e) => e.date === selectedDate).length})
          </button>

          <button
            onClick={() => setFilterType('critical')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'critical'
                ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Khẩn cấp P1
          </button>

          <button
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'pending'
                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Đang chờ
          </button>

          <button
            onClick={() => setFilterType('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'completed'
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ khóa..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Task List Grouped by Priority */}
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Không có sự kiện nào trong bộ lọc này
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Nhập vào ô ở trên hoặc nhấp nút Thêm Lịch để tạo nhiệm vụ và sự kiện phát sinh mới.
            </p>
          </div>
        ) : (
          priorityOrder.map((p) => {
            const groupEvents = filteredEvents.filter((e) => e.priority === p);
            if (groupEvents.length === 0) return null;

            const headerInfo = getPriorityHeading(p);

            return (
              <div key={p} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${headerInfo.badgeColor}`}>
                    {headerInfo.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    ({groupEvents.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {groupEvents.map((ev) => {
                    const [eH, eM] = ev.endTime.split(':').map(Number);
                    const endMin = eH * 60 + eM;
                    const isOverdue = selectedDate === todayStr && !ev.completed && curMinutes > endMin;
                    const isSelected = selectedIds.has(ev.id);

                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleSelectOne(ev.id);
                          } else {
                            onSelectEvent(ev);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600'
                            : ev.completed
                            ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                            : isOverdue
                            ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left Selection Checkbox in Selection Mode, or Complete Checkbox otherwise */}
                          {isSelectionMode ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectOne(ev.id);
                              }}
                              className="mt-0.5 p-1 rounded-md text-indigo-600 dark:text-indigo-400 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(ev.id);
                              }}
                              className={`mt-0.5 p-1 rounded-md transition-colors ${
                                ev.completed
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                              }`}
                              title={ev.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {ev.startTime} – {ev.endTime}
                              </span>

                              {ev.isEmergent && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                  <Zap className="w-3 h-3 fill-current" />
                                  Phát sinh
                                </span>
                              )}

                              {isOverdue && (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  Quá giờ dự kiến
                                </span>
                              )}
                            </div>

                            <h4
                              className={`text-sm font-semibold text-slate-900 dark:text-white ${
                                ev.completed ? 'line-through text-slate-500 dark:text-slate-500' : ''
                              }`}
                            >
                              {ev.title}
                            </h4>

                            {ev.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {ev.description}
                              </p>
                            )}

                            {ev.location && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{ev.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!isSelectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEvent(ev.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Xóa công việc"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Batch Delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa hàng loạt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thao tác này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn <strong>{selectedIds.size}</strong> sự kiện đã chọn khỏi danh sách và kho lưu trữ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs transition-colors"
              >
                Xác nhận xóa {selectedIds.size} sự kiện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
