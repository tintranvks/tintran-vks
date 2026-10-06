import { CalendarEvent, Priority, SmartNotification } from '../types/calendar';

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private notifiedEventMap: Set<string> = new Set();
  private notificationListeners: ((notification: SmartNotification) => void)[] = [];

  constructor() {
    // Check permission on boot
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chronos_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    }
  }

  public subscribe(listener: (notification: SmartNotification) => void) {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('chronos_sound_enabled', enabled ? 'true' : 'false');
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  public getBrowserPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Synthesize crystal chime using Web Audio API (zero audio files needed, works offline)
  public playPriorityChime(priority: Priority) {
    if (!this.soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (priority === 'critical') {
        // P1: Double urgent alert chime (High 880Hz + 1320Hz)
        this.createTone(880, now, 0.25, 0.28, 'sine');
        this.createTone(1320, now + 0.12, 0.45, 0.32, 'triangle');
        this.createTone(880, now + 0.35, 0.3, 0.25, 'sine');
        this.createTone(1320, now + 0.48, 0.5, 0.35, 'triangle');
      } else if (priority === 'high') {
        // P2: Bright clean chime (659Hz + 880Hz)
        this.createTone(659.25, now, 0.25, 0.25, 'sine');
        this.createTone(880, now + 0.15, 0.5, 0.3, 'sine');
      } else if (priority === 'medium') {
        // P3: Gentle pleasant chime (523Hz + 659Hz)
        this.createTone(523.25, now, 0.25, 0.2, 'sine');
        this.createTone(659.25, now + 0.18, 0.4, 0.2, 'sine');
      } else {
        // P4: Soft subtle ping (440Hz)
        this.createTone(440, now, 0.25, 0.15, 'sine');
      }
    } catch (e) {
      console.warn('Audio synthesis not supported or interaction blocked:', e);
    }
  }

  private createTone(freq: number, startTime: number, duration: number, peakGain: number, type: OscillatorType) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Check events and trigger smart reminders
  public checkAndTriggerReminders(events: CalendarEvent[], currentDate: Date) {
    const nowMs = currentDate.getTime();
    const todayStr = currentDate.toISOString().split('T')[0];

    events.forEach((ev) => {
      if (ev.completed || ev.date !== todayStr) return;

      const [sH, sM] = ev.startTime.split(':').map(Number);
      const eventStart = new Date(currentDate);
      eventStart.setHours(sH, sM, 0, 0);
      const diffMinutes = Math.round((eventStart.getTime() - nowMs) / 60000);

      // Check each configured reminder threshold
      const thresholds = ev.reminders && ev.reminders.length > 0 ? ev.reminders : [15, 5, 0];

      thresholds.forEach((threshold) => {
        // Trigger if within 1 minute window of the threshold
        if (diffMinutes >= threshold - 1 && diffMinutes <= threshold) {
          const key = `${ev.id}_thresh_${threshold}_${todayStr}`;
          if (!this.notifiedEventMap.has(key)) {
            this.notifiedEventMap.add(key);

            let msg = '';
            if (threshold === 0) {
              msg = ev.isEmergent
                ? `⚡ [Sự kiện phát sinh] "${ev.title}" đang bắt đầu ngay bây giờ!`
                : `⏰ Sự kiện "${ev.title}" đang bắt đầu ngay bây giờ!`;
            } else {
              msg = `Sự kiện sẽ bắt đầu sau ${threshold} phút (${ev.startTime})`;
            }

            const notif: SmartNotification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              eventId: ev.id,
              title: ev.title,
              message: msg,
              priority: ev.priority,
              timestamp: new Date().toISOString(),
              read: false,
            };

            // Play sound
            this.playPriorityChime(ev.priority);

            // Native Browser Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(ev.title, {
                  body: msg,
                  icon: '/favicon.ico',
                  tag: ev.id,
                });
              } catch {
                // background restriction
              }
            }

            // Vibrate mobile devices if supported (critical has stronger pattern)
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              if (ev.priority === 'critical') {
                navigator.vibrate([200, 100, 200, 100, 400]);
              } else {
                navigator.vibrate(200);
              }
            }

            // Dispatch to in-app listeners
            this.notificationListeners.forEach((l) => l(notif));
          }
        }
      });
    });
  }

  // Snooze an event reminder by X minutes
  public snoozeReminder(eventId: string, minutes: number) {
    const key = `snooze_${eventId}_${Date.now() + minutes * 60000}`;
    setTimeout(() => {
      this.playPriorityChime('high');
      const notif: SmartNotification = {
        id: `snooze_${Date.now()}`,
        eventId,
        title: 'Nhắc nhở đã hoãn lại',
        message: `Đã hết thời gian hoãn (${minutes} phút). Hãy kiểm tra công việc này!`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        read: false,
      };
      this.notificationListeners.forEach((l) => l(notif));
    }, minutes * 60000);
    return key;
  }
}

export const notificationService = new NotificationService();
