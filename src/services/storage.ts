/**
 * บริการเก็บข้อมูล (services/ — มี interface สลับ backend ได้)
 * - เบราว์เซอร์: localStorage
 * - Node (เทส unit): memory backend (ไม่มี localStorage)
 * อนาคต: สลับเป็น IndexedDB ได้ในไฟล์เดียว
 */

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryBackend implements StorageBackend {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function defaultBackend(): StorageBackend {
  if (typeof localStorage !== 'undefined') return localStorage;
  return new MemoryBackend();
}

let backend: StorageBackend = defaultBackend();

/** สำหรับเทส: เปลี่ยน backend ได้ (เช่น ต่อ reset ทุก test) */
export function setStorageBackend(next: StorageBackend): void {
  backend = next;
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = backend.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  backend.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  backend.removeItem(key);
}
