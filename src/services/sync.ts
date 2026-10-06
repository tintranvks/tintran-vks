import { CalendarEvent, SyncDevice } from '../types/calendar';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
type SyncListener = (events: CalendarEvent[], source: string) => void;
type SyncStateListener = (state: SyncState, lastSyncedAt: string) => void;

class SyncEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private listeners: SyncListener[] = [];
  private stateListeners: SyncStateListener[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentDeviceId: string = '';
  private currentDeviceName: string = '';
  private vaultId: string = 'main_vault';
  private syncState: SyncState = 'synced';
  private lastSyncedAt: string = new Date().toISOString();
  private pendingPushTimeout: any = null;

  constructor() {
    this.initDevice();
    this.initVaultId();
    this.initBroadcastChannel();
    this.initNetworkListeners();
    this.initEventSource();
    this.initVisibilityListener();
  }

  private initDevice() {
    if (typeof window === 'undefined') return;

    let devId = localStorage.getItem('chronos_device_id');
    if (!devId) {
      devId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('chronos_device_id', devId);
    }
    this.currentDeviceId = devId;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.currentDeviceName = isMobile ? 'Điện thoại di động (PWA/Mobile)' : 'Máy tính (PC/Laptop Web)';
  }

  private initVaultId() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('chronos_vault_id');
    if (stored) {
      this.vaultId = stored;
    } else {
      this.vaultId = 'main_vault';
      localStorage.setItem('chronos_vault_id', this.vaultId);
    }
  }

  public getVaultId(): string {
    return this.vaultId;
  }

  public setVaultId(newVaultId: string) {
    if (!newVaultId || !newVaultId.trim()) return;
    this.vaultId = newVaultId.trim();
    localStorage.setItem('chronos_vault_id', this.vaultId);
    this.initEventSource();
    this.pullFromCloud();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('chronos_realtime_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_EVENTS' && event.data.events) {
            this.listeners.forEach((listener) => listener(event.data.events, 'broadcast'));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.setSyncState('syncing');
        this.initEventSource();
        this.pullFromCloud();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.setSyncState('offline');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      });
    }
  }

  private initVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isOnline) {
          this.pullFromCloud();
        }
      });
    }
  }

  // Connect to Server-Sent Events (SSE) for Real-Time Instant Multi-Device Sync
  private initEventSource() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const sseUrl = `/api/sync/${encodeURIComponent(this.vaultId)}/events-stream`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.setSyncState('synced');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.events && Array.isArray(data.events)) {
            // Ignore updates originating from current device to prevent feedback echo
            if (data.sourceDeviceId !== this.currentDeviceId) {
              this.lastSyncedAt = data.updatedAt || new Date().toISOString();
              this.setSyncState('synced');
              this.listeners.forEach((l) => l(data.events, 'sse'));
            }
          }
        } catch {
          // ignore parse error
        }
      };

      this.eventSource.onerror = () => {
        // Will auto reconnect, keep calm
        this.setSyncState(this.isOnline ? 'synced' : 'offline');
      };
    } catch (err) {
      console.warn('EventSource connection skipped:', err);
    }
  }

  private setSyncState(state: SyncState) {
    this.syncState = state;
    this.stateListeners.forEach((l) => l(state, this.lastSyncedAt));
  }

  public subscribe(listener: SyncListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeState(listener: SyncStateListener) {
    this.stateListeners.push(listener);
    listener(this.syncState, this.lastSyncedAt);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  // Automatically push events to backend cloud storage and broadcast cross-device
  public autoSyncPush(events: CalendarEvent[]) {
    // 1. Cross-tab immediate broadcast
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SYNC_EVENTS',
          deviceId: this.currentDeviceId,
          timestamp: new Date().toISOString(),
          events,
        });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. Debounced Cloud push
    if (this.pendingPushTimeout) {
      clearTimeout(this.pendingPushTimeout);
    }

    this.setSyncState('syncing');

    this.pendingPushTimeout = setTimeout(async () => {
      if (!this.isOnline) {
        this.setSyncState('offline');
        return;
      }

      try {
        const response = await fetch(`/api/sync/${encodeURIComponent(this.vaultId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: this.currentDeviceId,
            events,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          this.lastSyncedAt = resData.updatedAt || new Date().toISOString();
          this.setSyncState('synced');
        } else {
          this.setSyncState('error');
        }
      } catch {
        this.setSyncState(this.isOnline ? 'error' : 'offline');
      }
    }, 400);
  }

  // Pull latest updates from Cloud
  public async pullFromCloud(): Promise<CalendarEvent[] | null> {
    if (!this.isOnline) return null;

    try {
      this.setSyncState('syncing');
      const res = await fetch(`/api/sync/${encodeURIComponent(this.vaultId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.events)) {
          this.lastSyncedAt = data.updatedAt || new Date().toISOString();
          this.setSyncState('synced');
          this.listeners.forEach((l) => l(data.events, 'cloud_pull'));
          return data.events;
        }
      }
      this.setSyncState('synced');
      return null;
    } catch {
      this.setSyncState(this.isOnline ? 'error' : 'offline');
      return null;
    }
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public getCurrentDevice(): SyncDevice {
    return {
      deviceId: this.currentDeviceId,
      deviceName: this.currentDeviceName,
      lastSyncedAt: this.lastSyncedAt,
      isCurrent: true,
    };
  }

  public generatePeerCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }

  public exportDataPackage(events: CalendarEvent[], includeSettings: boolean = true): string {
    const payload = {
      version: '1.0.0',
      vaultId: this.vaultId,
      exportedAt: new Date().toISOString(),
      deviceId: this.currentDeviceId,
      events,
      meta: {
        total: events.length,
        hasEmergent: events.some((e) => e.isEmergent),
        settings: includeSettings ? { sound: localStorage.getItem('chronos_sound_enabled') } : null,
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDataPackage(rawJson: string, existingEvents: CalendarEvent[]): CalendarEvent[] {
    try {
      const parsed = JSON.parse(rawJson);
      const incomingList: CalendarEvent[] = parsed.events || (Array.isArray(parsed) ? parsed : []);

      if (!Array.isArray(incomingList)) {
        throw new Error('Định dạng tệp không hợp lệ.');
      }

      const map = new Map<string, CalendarEvent>();
      existingEvents.forEach((ev) => map.set(ev.id, ev));

      incomingList.forEach((incoming) => {
        if (!map.has(incoming.id)) {
          map.set(incoming.id, incoming);
        } else {
          const current = map.get(incoming.id)!;
          const incTime = new Date(incoming.updatedAt || 0).getTime();
          const curTime = new Date(current.updatedAt || 0).getTime();
          if (incTime >= curTime) {
            map.set(incoming.id, incoming);
          }
        }
      });

      const merged = Array.from(map.values());
      this.autoSyncPush(merged);
      return merged;
    } catch (err) {
      throw new Error('Lỗi giải mã tệp dữ liệu: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  public exportToIcs(events: CalendarEvent[]): string {
    const formatIcsDate = (dateStr: string, timeStr: string) => {
      const [year, month, day] = dateStr.split('-');
      const [hour, min] = (timeStr || '00:00').split(':');
      return `${year}${month}${day}T${hour}${min}00`;
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chronos Smart Realtime Calendar//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Lịch Chronos',
    ];

    events.forEach((ev) => {
      const start = formatIcsDate(ev.date, ev.startTime);
      const end = formatIcsDate(ev.date, ev.endTime || ev.startTime);
      const summary = ev.isEmergent ? `[Phát sinh] ${ev.title}` : ev.title;

      ics.push(
        'BEGIN:VEVENT',
        `UID:${ev.id}@chronos.app`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString().split('T')[0], '00:00')}Z`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${summary.replace(/,/g, '\\,')}`,
        `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${(ev.location || '').replace(/,/g, '\\,')}`,
        `STATUS:${ev.completed ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      );
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }
}

export const syncEngine = new SyncEngine();
