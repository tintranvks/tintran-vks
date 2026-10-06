import React, { useState, useEffect } from 'react';
import { CalendarEvent, Priority, Category } from '../types/calendar';
import { X, Clock, Zap, MapPin, Bell, AlertCircle } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  initialDate?: string;
  initialHour?: number;
  initialIsEmergent?: boolean;
  editingEvent?: CalendarEvent | null;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialHour,
  initialIsEmergent = false,
  editingEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Priority>('high');
  const [category, setCategory] = useState<Category>('work');
  const [location, setLocation] = useState('');
  const [isEmergent, setIsEmergent] = useState(false);
  const [reminders, setReminders] = useState<number[]>([15, 5, 0]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setDate(editingEvent.date);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime);
      setPriority(editingEvent.priority);
      setCategory(editingEvent.category);
      setLocation(editingEvent.location || '');
      setIsEmergent(editingEvent.isEmergent);
      setReminders(editingEvent.reminders || [15, 5, 0]);
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      const startH = initialHour !== undefined ? initialHour : new Date().getHours();
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      setTitle('');
      setDescription('');
      setDate(defaultDate);
      setStartTime(`${pad(startH)}:00`);
      setEndTime(`${pad((startH + 1) % 24)}:00`);
      setPriority(initialIsEmergent ? 'critical' : 'high');
      setCategory(initialIsEmergent ? 'emergent' : 'work');
      setLocation('');
      setIsEmergent(initialIsEmergent);
      setReminders([15, 5, 0]);
    }
  }, [isOpen, editingEvent, initialDate, initialHour, initialIsEmergent]);

  if (!isOpen) return null;

  const handleDurationAdd = (mins: number) => {
    const [sH, sM] = startTime.split(':').map(Number);
    const totalMin = sH * 60 + sM + mins;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    setEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
  };

  const handleToggleReminder = (min: number) => {
    if (reminders.includes(min)) {
      setReminders(reminders.filter((m) => m !== min));
    } else {
      setReminders([...reminders, min].sort((a, b) => b - a));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventPayload: CalendarEvent = {
      id: editingEvent ? editingEvent.id : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime,
      endTime,
      priority,
      category,
      location: location.trim() || undefined,
      isEmergent,
      completed: editingEvent ? editingEvent.completed : false,
      completedAt: editingEvent ? editingEvent.completedAt : undefined,
      reminders,
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(eventPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {isEmergent ? (
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEvent ? 'Chỉnh sửa sự kiện' : isEmergent ? 'Ghi nhận việc phát sinh đột xuất' : 'Thêm lịch làm việc mới'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEmergent ? 'Ưu tiên hiển thị tức thời và cảnh báo thông minh' : 'Lên kế hoạch và nhắc nhở thời gian thực'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Emergent Toggle Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Việc phát sinh trong ngày
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Đánh dấu nhiệm vụ đột xuất cần xử lý ngay, gắn nhãn trực quan
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isEmergent}
              onChange={(e) => {
                setIsEmergent(e.target.checked);
                if (e.target.checked) {
                  setCategory('emergent');
                  setPriority('critical');
                }
              }}
              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề công việc / Sự kiện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Họp giải quyết sự cố, Nộp báo cáo tài chính..."
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày thực hiện
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bắt đầu
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kết thúc
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Thời lượng nhanh:</span>
            <button
              type="button"
              onClick={() => handleDurationAdd(15)}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +15p
            </button>
            <button
              type="button"
              onClick={() => handleDurationAdd(30)}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +30p
            </button>
            <button
              type="button"
              onClick={() => handleDurationAdd(60)}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +1h
            </button>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="critical">🔴 P1 · Khẩn cấp & Trọng yếu (Chuông cấp bách)</option>
                <option value="high">🟠 P2 · Ưu tiên cao (Chuông sáng)</option>
                <option value="medium">🔵 P3 · Tiêu chuẩn (Nhắc nhở nhẹ)</option>
                <option value="low">⚪ P4 · Linh hoạt (Không gây gián đoạn)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="work">💼 Công việc</option>
                <option value="meeting">🤝 Cuộc họp</option>
                <option value="emergent">⚡ Việc phát sinh</option>
                <option value="focus">🎯 Tập trung chuyên sâu</option>
                <option value="personal">🌱 Cá nhân</option>
              </select>
            </div>
          </div>

          {/* Smart Reminders Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              Thông báo nhắc nhở thông minh
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { min: 30, label: 'Trước 30 phút' },
                { min: 15, label: 'Trước 15 phút' },
                { min: 5, label: 'Trước 5 phút' },
                { min: 0, label: 'Đúng giờ bắt đầu' },
              ].map((item) => {
                const isChecked = reminders.includes(item.min);
                return (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => handleToggleReminder(item.min)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      isChecked
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}{item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Địa điểm / Kênh họp
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Phòng họp 302, Google Meet, Bàn làm việc..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú chi tiết
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú nội dung, mục tiêu hoặc tài liệu cần chuẩn bị..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs shadow-indigo-600/30 transition-colors"
            >
              {editingEvent ? 'Lưu thay đổi' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
