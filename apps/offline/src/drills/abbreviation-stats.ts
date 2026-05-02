import type { AbbreviationDirection } from "./drill-types.ts";

const STORAGE_KEY = "roc-trainer:abbreviation-stats";
const MAX_EVENTS = 500;

export interface AbbrAttemptEvent {
  readonly abbr: string;
  readonly direction: AbbreviationDirection;
  readonly correct: boolean;
  readonly ts: number;
}

export interface AbbrAggregate {
  readonly abbr: string;
  readonly attempts: number;
  readonly correct: number;
  readonly pctCorrect: number;
  readonly lastTs: number;
}

function isDirection(v: unknown): v is AbbreviationDirection {
  return v === "abbr-to-expansion" || v === "expansion-to-abbr";
}

function isAttempt(value: unknown): value is AbbrAttemptEvent {
  if (value === null || typeof value !== "object") return false;
  const ev = value as Record<string, unknown>;
  return (
    typeof ev["abbr"] === "string" &&
    isDirection(ev["direction"]) &&
    typeof ev["correct"] === "boolean" &&
    typeof ev["ts"] === "number"
  );
}

function safeRead(): AbbrAttemptEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAttempt);
  } catch {
    return [];
  }
}

function safeWrite(events: readonly AbbrAttemptEvent[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Safari private mode and quota errors are silently dropped — stats are not load-bearing.
  }
}

export function recordAbbreviationAttempt(event: AbbrAttemptEvent): void {
  const events = safeRead();
  events.push(event);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  safeWrite(trimmed);
}

export function clearAbbreviationStats(): void {
  safeWrite([]);
}

export function getAbbreviationAggregates(): AbbrAggregate[] {
  const events = safeRead();
  const grouped = new Map<string, AbbrAttemptEvent[]>();
  for (const ev of events) {
    const list = grouped.get(ev.abbr);
    if (list) list.push(ev);
    else grouped.set(ev.abbr, [ev]);
  }
  return Array.from(grouped.entries()).map(([abbr, evs]) => {
    const correct = evs.filter((e) => e.correct).length;
    const lastTs = evs.reduce((max, e) => (e.ts > max ? e.ts : max), 0);
    return {
      abbr,
      attempts: evs.length,
      correct,
      pctCorrect: Math.round((correct / evs.length) * 100),
      lastTs,
    };
  });
}
