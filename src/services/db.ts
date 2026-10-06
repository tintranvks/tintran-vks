import { CalendarEvent } from '../types/calendar';

const DB_NAME = 'chronos_calendar_db';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const LOCALSTORAGE_KEY = 'chronos_calendar_events_backup';

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initIndexedDB();
  }

  private async initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
            store.createIndex('isEmergent', 'isEmergent', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('IndexedDB failed to open, using LocalStorage fallback');
          resolve(null);
        };
      } catch (e) {
        console.warn('IndexedDB exception, falling back to LocalStorage', e);
        resolve(null);
      }
    });
  }

  public async getAllEvents(): Promise<CalendarEvent[]> {
    const db = await this.dbPromise;

    if (!db) {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!raw) {
        const seeded = this.getSeedEvents();
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      try {
        return JSON.parse(raw);
      } catch {
        return this.getSeedEvents();
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const items: CalendarEvent[] = req.result || [];
          if (items.length === 0) {
            const seeded = this.getSeedEvents();
            this.saveMultiple(seeded).then(() => resolve(seeded));
          } else {
            resolve(items);
          }
        };

        req.onerror = () => {
          resolve(this.getSeedEvents());
        };
      } catch {
        resolve(this.getSeedEvents());
      }
    });
  }

  public async saveEvent(event: CalendarEvent): Promise<void> {
    const db = await this.dbPromise;
    const now = new Date().toISOString();
    const eventToSave = { ...event, updatedAt: now };

    // Always update localStorage as immediate mirror
    this.mirrorToLocalStorage(eventToSave);

    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(eventToSave);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    }
  }

  public async saveMultiple(events: CalendarEvent[]): Promise<void> {
    const db = await this.dbPromise;
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(events));

    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          events.forEach((ev) => store.put(ev));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    }
  }

  public async deleteEvent(id: string): Promise<void> {
    return this.deleteMultiple([id]);
  }

  public async deleteMultiple(ids: string[]): Promise<void> {
    const db = await this.dbPromise;
    const idSet = new Set(ids);

    // Update localStorage mirror
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (raw) {
      try {
        const parsed: CalendarEvent[] = JSON.parse(raw);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(parsed.filter((e) => !idSet.has(e.id))));
      } catch {
        // ignore
      }
    }

    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          ids.forEach((id) => store.delete(id));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    }
  }

  private mirrorToLocalStorage(event: CalendarEvent) {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      const list: CalendarEvent[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        list[idx] = event;
      } else {
        list.push(event);
      }
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage quota or serialization error
    }
  }

  private getSeedEvents(): CalendarEvent[] {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Format current hours for dynamic realistic seed
    const curHour = today.getHours();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const h1 = Math.max(8, (curHour - 1 + 24) % 24);
    const h2 = curHour;
    const h3 = (curHour + 2) % 24;
    const h4 = (curHour + 4) % 24;

    return [
      {
        id: 'seed-1',
        title: 'Họp giao ban & Cập nhật tiến độ dự án quý IV',
        description: 'Đánh giá KPI, điều phối công việc giữa các bộ phận và tổng hợp báo cáo tài chính.',
        date: dateStr,
        startTime: `${pad(h1)}:00`,
        endTime: `${pad(h1)}:45`,
        priority: 'high',
        category: 'meeting',
        location: 'Phòng họp trực tuyến Teams',
        isEmergent: false,
        completed: true,
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        reminders: [15, 5],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-2',
        title: 'Xử lý sự cố triển khai hạ tầng & Đồng bộ dữ liệu',
        description: 'Sự kiện đột xuất phát sinh: Kiểm tra luồng dữ liệu thời gian thực và xác thực bảo mật.',
        date: dateStr,
        startTime: `${pad(h2)}:15`,
        endTime: `${pad(h2 + 1)}:00`,
        priority: 'critical',
        category: 'emergent',
        location: 'Hệ thống DevOps Cloud',
        isEmergent: true,
        completed: false,
        reminders: [30, 15, 5, 0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-3',
        title: 'Khối tập trung: Hoàn thiện tài liệu kiến trúc kỹ thuật',
        description: 'Soạn thảo tài liệu API, hướng dẫn triển khai GitHub và đặc tả mã hóa AES-GCM.',
        date: dateStr,
        startTime: `${pad(h3)}:00`,
        endTime: `${pad(h3 + 1)}:30`,
        priority: 'medium',
        category: 'focus',
        location: 'Bàn làm việc cá nhân',
        isEmergent: false,
        completed: false,
        reminders: [15],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-4',
        title: 'Kiểm tra phản hồi khách hàng & Duyệt đơn phát sinh',
        description: 'Tiếp nhận các yêu cầu điều chỉnh gấp từ đối tác.',
        date: dateStr,
        startTime: `${pad(h4)}:00`,
        endTime: `${pad(h4)}:30`,
        priority: 'low',
        category: 'work',
        location: 'Kênh Slack Hỗ trợ',
        isEmergent: true,
        completed: false,
        reminders: [10],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

export const localDb = new LocalDatabase();
