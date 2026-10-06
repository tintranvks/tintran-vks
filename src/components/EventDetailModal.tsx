import React from 'react';
import { CalendarEvent } from '../types/calendar';
import { 
  X, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Zap, 
  Bell, 
  ShieldCheck, 
  Share2,
  Calendar
} from 'lucide-react';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  if (!isOpen || !event) return null;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { label: 'P1 · Khẩn cấp & Trọng yếu', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'high':
        return { label: 'P2 · Ưu tiên cao', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'medium':
        return { label: 'P3 · Tiêu chuẩn', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      default:
        return { label: 'P4 · Linh hoạt', color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'work': return 'Công việc';
      case 'meeting': return 'Cuộc họp';
      case 'emergent': return 'Sự kiện phát sinh';
      case 'focus': return 'Tập trung chuyên sâu';
      case 'personal': return 'Cá nhân';
      default: return cat;
    }
  };

  const priorityBadge = getPriorityBadge(event.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityBadge.color}`}>
              {priorityBadge.label}
            </span>
            {event.isEmergent && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Zap className="w-3 h-3 fill-current" />
                Việc phát sinh
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(event)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Xóa sự kiện"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className={`text-base md:text-lg font-bold text-slate-900 dark:text-white ${event.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
              {event.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {event.startTime} – {event.endTime}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {event.date}
              </span>
              <span aria-hidden="true">·</span>
              <span>{getCategoryName(event.category)}</span>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Reminders summary */}
          {event.reminders && event.reminders.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nhắc trước:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {event.reminders.map((r) => (r === 0 ? 'Đúng giờ' : `${r} phút`)).join(', ')}
              </span>
            </div>
          )}

          {/* Quick status bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onToggleComplete(event.id);
                onClose();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                event.completed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{event.completed ? 'Đã hoàn thành (Bấm để hủy)' : 'Đánh dấu đã hoàn thành'}</span>
            </button>

            <span className="text-[11px] text-slate-400 font-mono">
              {event.completed ? 'Trạng thái: Hoàn tất' : 'Trạng thái: Đang chờ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
