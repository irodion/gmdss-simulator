/** Same date → same scenario, with adjacent days strictly never colliding. */

import { daysBetween } from "../../lib/date-utils.ts";
import type { ScenarioBank } from "./types.ts";

export function pickDailyScenarioId(bank: ScenarioBank, dateKey: string): string | null {
  const n = bank.scenarios.length;
  if (n === 0) return null;
  if (n === 1) return bank.scenarios[0]!.id;
  return bank.scenarios[servedIdx(dateKey, n)]!.id;
}

/**
 * Globally consistent served index. The recurrence
 *   served[i] = raw[i] === served[i-1] ? (raw[i] + 1) % n : raw[i]
 * trivially guarantees `served[i] !== served[i-1]` at every step. To make
 * the result independent of the query day (so today's chain agrees with
 * yesterday's chain on every shared day), we walk forward from a fixed
 * `ANCHOR_DATE_KEY`, chosen far enough in the past that the cost is bounded
 * (~one or two thousand cheap hashes) for any plausible call. Production
 * callers always pass `getLocalDateKey(Date.now())` — pre-anchor dates are
 * out of contract and would collapse to the anchor's served value.
 */
const ANCHOR_DATE_KEY = "2024-01-01";

function servedIdx(dateKey: string, n: number): number {
  const distance = Math.max(0, daysBetween(ANCHOR_DATE_KEY, dateKey));
  let cursor = ANCHOR_DATE_KEY;
  let served = hashIndex(cursor, n);
  for (let i = 0; i < distance; i++) {
    cursor = nextLocalDateKey(cursor);
    const raw = hashIndex(cursor, n);
    served = raw === served ? (raw + 1) % n : raw;
  }
  return served;
}

function nextLocalDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(y!, m! - 1, d! + 1);
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

function hashIndex(key: string, n: number): number {
  return djb2(key) % n;
}
