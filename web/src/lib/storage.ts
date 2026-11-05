/**
 * Tiny, safe wrappers around localStorage.
 * localStorage can be missing (server rendering) or throw (private mode,
 * blocked storage), so every access is guarded and falls back gracefully.
 */

export function readString(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is unavailable: the value just won't be remembered.
  }
}

export function readNumber(key: string, fallback = 0): number {
  const raw = readString(key);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
