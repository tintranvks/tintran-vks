import { CalendarEvent } from '../types/calendar';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;
const STORAGE_PREFIX = 'chronos_security_';

class SecurityEngine {
  private activeKey: CryptoKey | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.checkConfiguration();
  }

  private checkConfiguration() {
    const salt = localStorage.getItem(`${STORAGE_PREFIX}salt`);
    const verification = localStorage.getItem(`${STORAGE_PREFIX}verification`);
    this.isConfigured = Boolean(salt && verification);
  }

  public hasConfiguredPassword(): boolean {
    return this.isConfigured;
  }

  public isUnlocked(): boolean {
    if (!this.isConfigured) return true; // No password protection set yet
    return this.activeKey !== null;
  }

  public lockVault(): void {
    this.activeKey = null;
  }

  // Set initial passphrase or reset
  public async setupPassphrase(passphrase: string): Promise<boolean> {
    if (!passphrase || passphrase.length < 6) {
      throw new Error('Mật khẩu bảo mật phải có ít nhất 6 ký tự.');
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await this.deriveKey(passphrase, salt);
    
    // Store verification token encrypted with this key
    const verificationData = new TextEncoder().encode('CHRONOS_VERIFICATION_TOKEN_2026');
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encryptedVerification = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      verificationData
    );

    localStorage.setItem(`${STORAGE_PREFIX}salt`, this.bufferToBase64(salt));
    localStorage.setItem(`${STORAGE_PREFIX}iv`, this.bufferToBase64(iv));
    localStorage.setItem(`${STORAGE_PREFIX}verification`, this.bufferToBase64(encryptedVerification));
    
    this.activeKey = key;
    this.isConfigured = true;
    return true;
  }

  // Unlock with passphrase
  public async unlockVault(passphrase: string): Promise<boolean> {
    const saltBase64 = localStorage.getItem(`${STORAGE_PREFIX}salt`);
    const ivBase64 = localStorage.getItem(`${STORAGE_PREFIX}iv`);
    const verificationBase64 = localStorage.getItem(`${STORAGE_PREFIX}verification`);

    if (!saltBase64 || !ivBase64 || !verificationBase64) {
      throw new Error('Hệ thống chưa được thiết lập mật khẩu bảo mật.');
    }

    const salt = this.base64ToBuffer(saltBase64);
    const iv = this.base64ToBuffer(ivBase64);
    const verification = this.base64ToBuffer(verificationBase64);

    const derivedKey = await this.deriveKey(passphrase, salt);

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        derivedKey,
        verification as unknown as BufferSource
      );
      const text = new TextDecoder().decode(decrypted);
      if (text === 'CHRONOS_VERIFICATION_TOKEN_2026') {
        this.activeKey = derivedKey;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Encrypt an event's sensitive fields
  public async encryptEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (!this.activeKey) {
      // If no encryption key is set, keep plain
      return event;
    }

    try {
      const sensitivePayload = JSON.stringify({
        title: event.title,
        description: event.description,
        location: event.location,
      });

      const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encoded = new TextEncoder().encode(sensitivePayload);

      const cipher = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        this.activeKey,
        encoded
      );

      const encryptedBlob = `${this.bufferToBase64(iv)}:${this.bufferToBase64(cipher)}`;

      return {
        ...event,
        title: '🔒 [Đã mã hóa dữ liệu]',
        description: encryptedBlob,
        isEncrypted: true,
      };
    } catch (err) {
      console.error('Encryption failed:', err);
      return event;
    }
  }

  // Decrypt an event
  public async decryptEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (!event.isEncrypted || !event.description || !this.activeKey) {
      return event;
    }

    try {
      const parts = event.description.split(':');
      if (parts.length !== 2) return event;

      const iv = this.base64ToBuffer(parts[0]);
      const cipher = this.base64ToBuffer(parts[1]);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        this.activeKey,
        cipher as unknown as BufferSource
      );

      const parsed = JSON.parse(new TextDecoder().decode(decrypted));
      return {
        ...event,
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        isEncrypted: false,
      };
    } catch {
      // Key may be different or locked
      return event;
    }
  }

  // Helper: Key derivation from password using PBKDF2
  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
    const bin = String.fromCharCode(...new Uint8Array(buf as ArrayBuffer));
    return window.btoa(bin);
  }

  private base64ToBuffer(b64: string): Uint8Array {
    const bin = window.atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }
}

export const securityEngine = new SecurityEngine();
