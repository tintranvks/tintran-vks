import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent, Priority, Category } from '../types/calendar';
import { 
  Search, 
  X, 
  Clock, 
  Calendar, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onJumpToDate: (date: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  onJumpToDate,
}) => {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilterCategory('all');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const q = query.trim().toLowerCase();

    // Category filter tab
    if (filterCategory === 'emergent' && !ev.isEmergent) return false;
    if (filterCategory === 'critical' && ev.priority !== 'critical') return false;
    if (filterCategory === 'meeting' && ev.category !== 'meeting') return false;
    if (filterCategory === 'work' && ev.category !== 'work') return false;
    if (filterCategory === 'pending' && ev.completed) return false;

    if (!q) return true; // If no text query, show all in category

    const matchTitle = ev.title.toLowerCase().includes(q);
    const matchDesc = ev.description ? ev.description.toLowerCase().includes(q) : false;
    const matchLocation = ev.location ? ev.location.toLowerCase().includes(q) : false;
    const matchDate = ev.date.includes(q) || ev.date.split('-').reverse().join('/').includes(q);
    const matchCategory = ev.category.toLowerCase().includes(q);
    const matchPriority = (
      ev.priority.toLowerCase().includes(q) ||
      (q === 'p1' && ev.priority === 'critical') ||
      (q === 'p2' && ev.priority === 'high') ||
      (q === 'p3' && ev.priority === 'medium') ||
      (q === 'p4' && ev.priority === 'low') ||
      (q.includes('khẩn') && ev.priority === 'critical')
    );
    const matchEmergent = q.includes('phát sinh') && ev.isEmergent;

    return matchTitle || matchDesc || matchLocation || matchDate || matchCategory || matchPriority || matchEmergent;
  });

  // Handle Keyboard navigation (Arrow keys, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredEvents.length > 0 ? (prev + 1) % filteredEvents.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredEvents.length > 0 ? (prev - 1 + filteredEvents.length) % filteredEvents.length : 0));
      } else if (e.key === 'Enter') {
        if (filteredEvents[selectedIndex]) {
          e.preventDefault();
          const target = filteredEvents[selectedIndex];
          onJumpToDate(target.date);
          onSelectEvent(target);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredEvents, selectedIndex, onClose, onJumpToDate, onSelectEvent]);

  // Keep selected index in view
  useEffect(() => {
    if (selectedIndex >= filteredEvents.length) {
      setSelectedIndex(0);
    }
  }, [filteredEvents.length, selectedIndex]);

  if (!isOpen) return null;

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'critical':
        return { label: 'P1 · Khẩn cấp', style: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60' };
      case 'high':
        return { label: 'P2 · Ưu tiên cao', style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' };
      case 'medium':
        return { label: 'P3 · Tiêu chuẩn', style: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900/60' };
      default:
        return { label: 'P4 · Linh hoạt', style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const getCategoryName = (cat: Category) => {
    switch (cat) {
      case 'work': return 'Công việc';
      case 'meeting': return 'Cuộc họp';
      case 'emergent': return 'Phát sinh';
      case 'focus': return 'Tập trung';
      case 'personal': return 'Cá nhân';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm theo tiêu đề, ghi chú, thẻ, địa điểm hoặc ngày (ví dụ: 2026-10-06)..."
            className="flex-1 bg-transparent text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-400 mr-1 shrink-0">Lọc nhanh:</span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'emergent', label: '⚡ Việc phát sinh' },
            { id: 'critical', label: '🔴 Khẩn cấp P1' },
            { id: 'meeting', label: '🤝 Cuộc họp' },
            { id: 'work', label: '💼 Công việc' },
            { id: 'pending', label: 'Đang chờ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterCategory(tab.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap text-xs ${
                filterCategory === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Không tìm thấy sự kiện phù hợp
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Thử tìm với từ khóa khác như tên người, nội dung cuộc họp hoặc ngày (YYYY-MM-DD).
              </p>
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const badge = getPriorityBadge(ev.priority);
              const isHighlighted = idx === selectedIndex;

              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    onJumpToDate(ev.date);
                    onSelectEvent(ev);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isHighlighted
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-1 ring-indigo-500/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Metadata line */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.style}`}>
                        {badge.label}
                      </span>

                      {ev.isEmergent && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Zap className="w-3 h-3 fill-current" />
                          Phát sinh
                        </span>
                      )}

                      <span aria-hidden="true">·</span>

                      <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {ev.date}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ev.startTime} – {ev.endTime}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span>{getCategoryName(ev.category)}</span>
                    </div>

                    {/* Title */}
                    <h4 className={`text-sm font-semibold truncate ${ev.completed ? 'line-through opacity-60 text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {ev.title}
                    </h4>

                    {/* Description preview */}
                    {ev.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {ev.description}
                      </p>
                    )}

                    {/* Location preview */}
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Action Cue */}
                  <div className="flex items-center gap-2 self-center shrink-0">
                    {ev.completed ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↓</kbd>
              <span>Di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↵</kbd>
              <span>Xem chi tiết</span>
            </span>
          </div>

          <span className="font-mono tabular-nums text-[11px]">
            {filteredEvents.length} kết quả
          </span>
        </div>
      </div>
    </div>
  );
};
