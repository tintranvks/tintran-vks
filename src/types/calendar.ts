export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type Category = 'work' | 'meeting' | 'emergent' | 'personal' | 'focus';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAllDay?: boolean;
  priority: Priority;
  category: Category;
  location?: string;
  isEmergent: boolean; // Việc phát sinh trong ngày
  completed: boolean;
  completedAt?: string;
  reminders: number[]; // e.g. [15, 5, 0] minutes before
  createdAt: string;
  updatedAt: string;
  isEncrypted?: boolean;
}

export interface EncryptedEventRecord {
  id: string;
  iv: string; // Base64
  ciphertext: string; // Base64
  salt: string; // Base64
  updatedAt: string;
}

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda' | 'emergent' | 'analytics';

export interface SmartNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  priority: Priority;
  timestamp: string;
  read: boolean;
  acknowledged?: boolean;
}

export interface SecurityStatus {
  isEncryptionConfigured: boolean;
  isUnlocked: boolean;
  algorithm: string;
  keyIterations: number;
  lastLockedAt?: string;
}

export interface SyncDevice {
  deviceId: string;
  deviceName: string;
  lastSyncedAt: string;
  isCurrent: boolean;
}
