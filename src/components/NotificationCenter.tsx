import React from 'react';
import { SmartNotification, Priority } from '../types/calendar';
import { notificationService } from '../services/notifications';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Check, 
  Trash2, 
  Play, 
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onSnooze: (eventId: string, minutes: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onSnooze,
  soundEnabled,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  const browserPerm = notificationService.getBrowserPermission();

  const handleRequestPerm = async () => {
    await notificationService.requestBrowserPermission();
  };

  const handleTestChime = (p: Priority) => {
    notificationService.playPriorityChime(p);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-500 text-white';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'medium':
        return 'bg-sky-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Trung Tâm Thông Báo & Nhắc Nhở Thông Minh
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân loại đa tầng theo độ ưu tiên P1 - P4 và phát sinh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings & Permissions Bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Sound Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Chuông âm thanh: BẬT' : 'Chuông âm thanh: TẮT'}</span>
            </button>

            {/* Test Chimes */}
            {soundEnabled && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTestChime('critical')}
                  className="px-2 py-1 text-[10px] rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:opacity-80"
                  title="Thử âm chuông khẩn cấp P1"
                >
                  Thử P1
                </button>
                <button
                  onClick={() => handleTestChime('high')}
                  className="px-2 py-1 text-[10px] rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:opacity-80"
                  title="Thử âm chuông cao P2"
                >
                  Thử P2
                </button>
              </div>
            )}
          </div>

          {/* Browser Notification Permission */}
          <div>
            {browserPerm === 'granted' ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Trình duyệt đã cho phép
              </span>
            ) : (
              <button
                onClick={handleRequestPerm}
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                Bật thông báo Desktop
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 min-h-[220px]">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có cảnh báo nào. Hệ thống sẽ tự động nhắc nhở khi đến giờ lịch làm việc!
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const timeStr = new Date(notif.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityBadge(notif.priority)}`}>
                        {notif.priority.toUpperCase()}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {notif.title}
                      </h4>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    {notif.message}
                  </p>

                  {/* Actions: Snooze, Dismiss */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>Hoãn lại:</span>
                      <button
                        onClick={() => onSnooze(notif.eventId, 5)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      >
                        +5p
                      </button>
                      <button
                        onClick={() => onSnooze(notif.eventId, 15)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      >
                        +15p
                      </button>
                    </div>

                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã hiểu</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ thông báo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
