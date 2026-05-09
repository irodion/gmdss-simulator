/**
 * Local-time day bucketing helpers.
 *
 * Use local time (not UTC) so a user practicing at 11pm and 1am the next
 * morning is on two distinct calendar days. Uses standard `Date` math so
 * DST and month/year/leap rollovers fall out for free — no manual modular
 * arithmetic.
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" in the user's local timezone. */
export function getLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseLocalKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((s) => Number.parseInt(s, 10));
  return new Date(y!, m! - 1, d!);
}

/** "YYYY-MM-DD" for the day before the given key. Local-time math. */
export function previousLocalDateKey(dateKey: string): string {
  const d = parseLocalKey(dateKey);
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d.getTime());
}

/**
 * Inclusive distance in calendar days between two date keys (`later - earlier`).
 * Same day returns 0; adjacent days return 1. Symmetric: callers must pass
 * `earlier` first or the result is negative.
 */
export function daysBetween(earlier: string, later: string): number {
  const a = parseLocalKey(earlier).getTime();
  const b = parseLocalKey(later).getTime();
  // Math.round absorbs DST's ±1 hour so 23-hour and 25-hour calendar days
  // still resolve to integer day distances.
  return Math.round((b - a) / 86_400_000);
}
