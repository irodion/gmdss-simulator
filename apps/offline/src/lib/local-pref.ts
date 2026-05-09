/**
 * Shared localStorage adapter for scalar boolean preferences.
 *
 * Use the standard `"true"` / `"false"` string contract so values written
 * by either side roundtrip cleanly. Defensive try/catch covers Safari
 * private mode and quota errors — preferences are never load-bearing.
 */

export function readBoolPref(key: string, defaultValue: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === "true";
  } catch {
    return defaultValue;
  }
}

export function writeBoolPref(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    /* private mode / quota — preference is not load-bearing */
  }
}
