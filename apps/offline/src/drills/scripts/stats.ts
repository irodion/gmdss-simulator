import type { DimensionId, GradeEvent, ScriptDrillMode } from "./types.ts";

type StoredMode = ScriptDrillMode | "structural";

interface StoredEvent {
  readonly rubricId: string;
  readonly mode: StoredMode;
  readonly key: string;
  readonly ts: number;
  readonly correct: boolean;
  readonly scenarioId?: string;
  readonly dimensionPasses?: Readonly<Record<DimensionId, boolean>>;
}

const STORAGE_KEY = "roc-trainer:procedure-stats";
const MAX_EVENTS = 200;

export interface StatsAggregate {
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly attempts: number;
  readonly correct: number;
  readonly pctCorrect: number;
}

const KNOWN_DIMENSIONS: readonly DimensionId[] = [
  "priority",
  "vessel",
  "body",
  "ending",
  "procedure",
];

function isDimensionPasses(value: unknown): value is Record<DimensionId, boolean> {
  if (value === null || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return Object.entries(rec).every(
    ([k, v]) => KNOWN_DIMENSIONS.includes(k as DimensionId) && typeof v === "boolean",
  );
}

function isStoredEvent(value: unknown): value is StoredEvent {
  if (value === null || typeof value !== "object") return false;
  const ev = value as Record<string, unknown>;
  if (
    typeof ev["rubricId"] !== "string" ||
    typeof ev["key"] !== "string" ||
    typeof ev["ts"] !== "number" ||
    typeof ev["correct"] !== "boolean"
  ) {
    return false;
  }
  // Accept both legacy "structural" and new "scenario" modes in storage; legacy
  // events are filtered out at aggregate-time by mode equality.
  if (ev["mode"] !== "scenario" && ev["mode"] !== "structural") return false;
  if (ev["scenarioId"] !== undefined && typeof ev["scenarioId"] !== "string") return false;
  if (ev["dimensionPasses"] !== undefined && !isDimensionPasses(ev["dimensionPasses"])) {
    return false;
  }
  return true;
}

function safeRead(): StoredEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredEvent);
  } catch {
    return [];
  }
}

function safeWrite(events: readonly StoredEvent[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Safari private mode and quota errors are silently dropped — stats are not load-bearing.
  }
}

export function recordAttempt(event: GradeEvent): void {
  const events = safeRead();
  events.push(event as StoredEvent);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  safeWrite(trimmed);
}

export function clearStats(): void {
  safeWrite([]);
}

export function getAggregates(): StatsAggregate[] {
  const events = safeRead().filter((e) => e.mode === "scenario");
  const grouped = new Map<string, { mode: ScriptDrillMode; key: string; events: StoredEvent[] }>();
  for (const ev of events) {
    const groupKey = `${ev.mode}:${ev.key}`;
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.events.push(ev);
    } else {
      grouped.set(groupKey, {
        mode: ev.mode as ScriptDrillMode,
        key: ev.key,
        events: [ev],
      });
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
