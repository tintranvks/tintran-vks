import { CalendarEvent } from '../types/calendar';

export interface NaturalBackupSnapshot {
  id: string;
  timestamp: string;
  eventCount: number;
  label: string;
  events: CalendarEvent[];
}

const BACKUP_KEY = 'chronos_natural_backups';
const MAX_SNAPSHOTS = 15;

type SnapshotListener = (snapshots: NaturalBackupSnapshot[]) => void;

class NaturalBackupService {
  private lastBackupTime: string | null = null;
  private listeners: Set<SnapshotListener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    const list = this.getSnapshots();
    if (list.length > 0) {
      this.lastBackupTime = list[0].timestamp;
    }
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snaps = this.getSnapshots();
    this.listeners.forEach((fn) => {
      try {
        fn(snaps);
      } catch (err) {
        console.error('Error notifying backup listener:', err);
      }
    });
  }

  public getSnapshots(): NaturalBackupSnapshot[] {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Create a natural auto-backup snapshot
  public createSnapshot(events: CalendarEvent[], label: string = 'Sao lưu tự nhiên'): NaturalBackupSnapshot {
    const now = new Date().toISOString();
    const snapshot: NaturalBackupSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: now,
      eventCount: events.length,
      label,
      events,
    };

    const existing = this.getSnapshots();
    const updated = [snapshot, ...existing.filter((s) => s.id !== snapshot.id)].slice(0, MAX_SNAPSHOTS);

    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
      this.lastBackupTime = now;
      this.notify();
    } catch (e) {
      console.warn('Storage quota exceeded for natural backup, trimming oldest:', e);
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(updated.slice(0, 5)));
        this.lastBackupTime = now;
        this.notify();
      } catch {
        // ignore
      }
    }

    return snapshot;
  }

  // Check if natural backup should run (every 5 minutes or when first initialized)
  public autoCheckAndBackup(events: CalendarEvent[]) {
    if (events.length === 0) return;
    const now = Date.now();
    const existing = this.getSnapshots();
    const last = this.lastBackupTime ? new Date(this.lastBackupTime).getTime() : 0;
    
    // Auto-backup if no snapshots exist yet, or more than 5 minutes have passed since last backup
    if (existing.length === 0 || now - last > 5 * 60 * 1000) {
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.createSnapshot(events, `Sao lưu tự nhiên lúc ${timeStr}`);
    }
  }

  public getLastBackupTime(): string | null {
    return this.lastBackupTime;
  }

  public deleteSnapshot(id: string) {
    const list = this.getSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
    this.notify();
  }
}

export const naturalBackupService = new NaturalBackupService();
