import type { GradeEvent, ScriptDrillMode } from "./types.ts";

const STORAGE_KEY = "roc-trainer:procedure-stats";
const MAX_EVENTS = 200;

export interface StatsAggregate {
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly attempts: number;
  readonly correct: number;
  readonly pctCorrect: number;
}

function safeRead(): GradeEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GradeEvent[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(events: readonly GradeEvent[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Safari private mode and quota errors are silently dropped — stats are not load-bearing.
  }
}

export function recordAttempt(event: GradeEvent): void {
  const events = safeRead();
  events.push(event);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  safeWrite(trimmed);
}

export function clearStats(): void {
  safeWrite([]);
}

export function getAggregates(): StatsAggregate[] {
  const events = safeRead();
  const grouped = new Map<string, { mode: ScriptDrillMode; key: string; events: GradeEvent[] }>();
  for (const ev of events) {
    const groupKey = `${ev.mode}:${ev.key}`;
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.events.push(ev);
    } else {
      grouped.set(groupKey, { mode: ev.mode, key: ev.key, events: [ev] });
    }
  }
  return Array.from(grouped.values()).map(({ mode, key, events: evs }) => {
    const correct = evs.filter((e) => e.correct).length;
    return {
      mode,
      key,
      attempts: evs.length,
      correct,
      pctCorrect: Math.round((correct / evs.length) * 100),
    };
  });
}

export function getAggregateFor(mode: ScriptDrillMode, key: string): StatsAggregate | null {
  return getAggregates().find((a) => a.mode === mode && a.key === key) ?? null;
}
