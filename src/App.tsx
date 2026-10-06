import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarViewMode, Category, Priority, SecurityStatus, SmartNotification } from './types/calendar';
import { localDb } from './services/db';
import { syncEngine, SyncState } from './services/sync';
import { notificationService } from './services/notifications';
import { securityEngine } from './services/security';

import { Header } from './components/Header';
import { HappeningNowBar } from './components/HappeningNowBar';
import { Sidebar } from './components/Sidebar';
import { CalendarDayView } from './components/CalendarDayView';
import { CalendarWeekView } from './components/CalendarWeekView';
import { CalendarMonthView } from './components/CalendarMonthView';
import { EmergentTaskList } from './components/EmergentTaskList';
import { QuickAddModal } from './components/QuickAddModal';
import { EventDetailModal } from './components/EventDetailModal';
import { SecurityModal } from './components/SecurityModal';
import { SyncModal } from './components/SyncModal';
import { NotificationCenter } from './components/NotificationCenter';
import { MobileNav } from './components/MobileNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MainPortalDashboard } from './components/MainPortalDashboard';
import { naturalBackupService } from './services/naturalBackup';

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<CalendarViewMode>('day');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [syncState, setSyncState] = useState<SyncState>('synced');

  // Screen Mode: 'dashboard' (Bảng điều khiển chọn công cụ riêng biệt) | 'work_management' (Bộ công cụ quản lý công việc)
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'work_management'>('dashboard');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chronos_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Network & Sound state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(notificationService.isSoundEnabled());

  // Security Status
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isEncryptionConfigured: securityEngine.hasConfiguredPassword(),
    isUnlocked: securityEngine.isUnlocked(),
    algorithm: 'AES-256-GCM',
    keyIterations: 100000,
  });

  // Notifications
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddIsEmergent, setQuickAddIsEmergent] = useState(false);
  const [quickAddInitialHour, setQuickAddInitialHour] = useState<number | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync theme with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chronos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chronos_theme', 'light');
    }
  }, [isDarkMode]);

  // Load events from IndexedDB on startup & pull from cloud
  useEffect(() => {
    localDb.getAllEvents().then((loaded) => {
      setEvents(loaded);
      // Attempt cloud pull on boot
      syncEngine.pullFromCloud();
    });
  }, []);

  // Real-time ticking clock (1s interval)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state listener
  useEffect(() => {
    const unsubState = syncEngine.subscribeState((state) => {
      setSyncState(state);
    });
    return unsubState;
  }, []);

  // Multi-Device / Cross-Tab / Server SSE Sync Subscription
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(async (incomingEvents) => {
      await localDb.saveMultiple(incomingEvents);
      const decryptedEvents = await Promise.all(
        incomingEvents.map((ev) => securityEngine.decryptEvent(ev))
      );
      setEvents(decryptedEvents);
    });
    return unsubscribe;
  }, []);

  // Notifications Service Subscription
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });
    return unsubscribe;
  }, []);

  // Smart Reminder Check Scheduler (Every 30 seconds)
  useEffect(() => {
    notificationService.checkAndTriggerReminders(events, currentTime);
    const interval = setInterval(() => {
      notificationService.checkAndTriggerReminders(events, new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [events, currentTime]);

  // Natural Auto-Backup on events change or load
  useEffect(() => {
    if (events.length > 0) {
      naturalBackupService.autoCheckAndBackup(events);
    }
  }, [events]);

  const refreshSecurityStatus = useCallback(() => {
    setSecurityStatus({
      isEncryptionConfigured: securityEngine.hasConfiguredPassword(),
      isUnlocked: securityEngine.isUnlocked(),
      algorithm: 'AES-256-GCM',
      keyIterations: 100000,
    });
  }, []);

  // Save / Update Event
  const handleSaveEvent = async (event: CalendarEvent) => {
    let finalEvent = event;
    if (securityEngine.hasConfiguredPassword() && securityEngine.isUnlocked()) {
      // Automatic transparent encryption if unlocked
      finalEvent = await securityEngine.encryptEvent(event);
    }

    await localDb.saveEvent(finalEvent);
    
    // Decrypt in memory for active view
    const displayEvent = await securityEngine.decryptEvent(finalEvent);

    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === displayEvent.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), displayEvent, ...prev.slice(idx + 1)] : [...prev, displayEvent];
      syncEngine.autoSyncPush(next);
      return next;
    });

    // If emergent, play bright chime
    if (event.isEmergent) {
      notificationService.playPriorityChime('high');
    }
  };

  // Toggle Complete
  const handleToggleComplete = async (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;

    const updated: CalendarEvent = {
      ...target,
      completed: !target.completed,
      completedAt: !target.completed ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    await localDb.saveEvent(updated);
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? updated : e));
      syncEngine.autoSyncPush(next);
      return next;
    });

    if (updated.completed) {
      notificationService.playPriorityChime('low');
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    await localDb.deleteEvent(id);
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      syncEngine.autoSyncPush(next);
      return next;
    });
  };

  // Batch Delete Events
  const handleBatchDeleteEvents = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    await localDb.deleteMultiple(ids);
    setEvents((prev) => {
      const idSet = new Set(ids);
      const next = prev.filter((e) => !idSet.has(e.id));
      syncEngine.autoSyncPush(next);
      return next;
    });
  };

  // Batch Mark Complete Events
  const handleBatchCompleteEvents = async (ids: string[], completed: boolean) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const updatedEvents = events.map((e) => {
      if (idSet.has(e.id)) {
        return {
          ...e,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return e;
    });
    await localDb.saveMultiple(updatedEvents);
    setEvents(updatedEvents);
    syncEngine.autoSyncPush(updatedEvents);
  };

  // Restore Natural Backup Snapshot
  const handleRestoreSnapshot = async (restoredEvents: CalendarEvent[]) => {
    await localDb.saveMultiple(restoredEvents);
    setEvents(restoredEvents);
    syncEngine.autoSyncPush(restoredEvents);
  };

  // Quick Rapid Add for emergent events
  const handleRapidAddEmergent = (title: string, priority: Priority, isEmergent: boolean) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const curH = currentTime.getHours();
    const curM = currentTime.getMinutes();
    const startStr = `${pad(curH)}:${pad(curM)}`;
    const endH = (curH + 1) % 24;
    const endStr = `${pad(endH)}:${pad(curM)}`;

    const newEv: CalendarEvent = {
      id: `ev_rapid_${Date.now()}`,
      title,
      date: selectedDate,
      startTime: startStr,
      endTime: endStr,
      priority,
      category: isEmergent ? 'emergent' : 'work',
      isEmergent,
      completed: false,
      reminders: [15, 5, 0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleSaveEvent(newEv);
  };

  // Filter events by selectedCategory
  const displayedEvents = events.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category === selectedCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 1. STANDALONE MAIN SUITE DASHBOARD (Bảng điều khiển chọn công cụ)
  if (activeScreen === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <MainPortalDashboard
          events={events}
          currentTime={currentTime}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          isOnline={isOnline}
          onOpenWorkManagement={(initialView = 'day') => {
            setCurrentView(initialView);
            setActiveScreen('work_management');
          }}
        />
      </div>
    );
  }

  // 2. FULL WORK MANAGEMENT SUITE (Bộ công cụ Quản lý công việc Chronos)
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Real-time Top Bar */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onBackToDashboard={() => setActiveScreen('dashboard')}
        onOpenQuickAdd={(isEmergent) => {
          setEditingEvent(null);
          setQuickAddIsEmergent(Boolean(isEmergent));
          setQuickAddInitialHour(undefined);
          setIsQuickAddOpen(true);
        }}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        unreadNotificationsCount={unreadCount}
        securityStatus={securityStatus}
        isOnline={isOnline}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        currentTime={currentTime}
        syncState={syncState}
      />

      {/* Happening Now Real-Time Tracker Bar */}
      <HappeningNowBar
        events={events}
        currentTime={currentTime}
        onToggleComplete={handleToggleComplete}
        onSelectEvent={(ev) => setSelectedEventDetail(ev)}
        onQuickAddEmergent={() => {
          setEditingEvent(null);
          setQuickAddIsEmergent(true);
          setQuickAddInitialHour(currentTime.getHours());
          setIsQuickAddOpen(true);
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden pb-14 lg:pb-0">
        {/* Left Desktop Sidebar */}
        <Sidebar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          events={events}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onQuickAddEmergent={() => {
            setEditingEvent(null);
            setQuickAddIsEmergent(true);
            setQuickAddInitialHour(currentTime.getHours());
            setIsQuickAddOpen(true);
          }}
          currentTime={currentTime}
          currentView={currentView}
          onViewChange={setCurrentView}
          onBackToDashboard={() => setActiveScreen('dashboard')}
        />

        {/* Center Main Calendar View */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
          {currentView === 'day' && (
            <CalendarDayView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              events={displayedEvents}
              currentTime={currentTime}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
              onSlotClick={(date, hour) => {
                setEditingEvent(null);
                setQuickAddIsEmergent(false);
                setSelectedDate(date);
                setQuickAddInitialHour(hour);
                setIsQuickAddOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
            />
          )}

          {currentView === 'week' && (
            <CalendarWeekView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              events={displayedEvents}
              currentTime={currentTime}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
              onSlotClick={(date, hour) => {
                setEditingEvent(null);
                setQuickAddIsEmergent(false);
                setSelectedDate(date);
                setQuickAddInitialHour(hour);
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {currentView === 'month' && (
            <CalendarMonthView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              events={displayedEvents}
              currentTime={currentTime}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
              onSwitchToDayView={(date) => {
                setSelectedDate(date);
                setCurrentView('day');
              }}
            />
          )}

          {currentView === 'emergent' && (
            <EmergentTaskList
              events={events}
              selectedDate={selectedDate}
              currentTime={currentTime}
              onToggleComplete={handleToggleComplete}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
              onDeleteEvent={handleDeleteEvent}
              onDeleteBatch={handleBatchDeleteEvents}
              onBatchComplete={handleBatchCompleteEvents}
              onQuickAdd={handleRapidAddEmergent}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsDashboard
              events={events}
              currentTime={currentTime}
              selectedDate={selectedDate}
              onRestoreSnapshot={handleRestoreSnapshot}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onBackToDashboard={() => setActiveScreen('dashboard')}
        onOpenQuickAdd={(isEmergent) => {
          setEditingEvent(null);
          setQuickAddIsEmergent(Boolean(isEmergent));
          setQuickAddInitialHour(currentTime.getHours());
          setIsQuickAddOpen(true);
        }}
      />

      {/* Quick Add / Edit Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
        initialHour={quickAddInitialHour}
        initialIsEmergent={quickAddIsEmergent}
        editingEvent={editingEvent}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={Boolean(selectedEventDetail)}
        event={selectedEventDetail}
        onClose={() => setSelectedEventDetail(null)}
        onEdit={(ev) => {
          setSelectedEventDetail(null);
          setEditingEvent(ev);
          setIsQuickAddOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onToggleComplete={handleToggleComplete}
      />

      {/* Security E2EE Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        securityStatus={securityStatus}
        onRefreshStatus={refreshSecurityStatus}
        onExportEncryptedVault={() => {
          const jsonStr = syncEngine.exportDataPackage(events);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chronos_encrypted_vault_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      {/* Multi-Device Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        events={events}
        onImportEvents={(newEvents) => {
          localDb.saveMultiple(newEvents);
          setEvents(newEvents);
          syncEngine.autoSyncPush(newEvents);
        }}
        isOnline={isOnline}
        syncState={syncState}
        onManualSyncNow={() => {
          syncEngine.pullFromCloud();
        }}
      />

      {/* Smart Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        onClearAll={() => setNotifications([])}
        onSnooze={(eventId, mins) => {
          notificationService.snoozeReminder(eventId, mins);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          notificationService.setSoundEnabled(next);
          setSoundEnabled(next);
        }}
      />

      {/* Global Search & Filter Command Palette (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        events={events}
        onSelectEvent={(ev) => setSelectedEventDetail(ev)}
        onJumpToDate={(date) => {
          setSelectedDate(date);
          setCurrentView('day');
        }}
      />
    </div>
  );
}

