import type { AbbreviationDirection } from "./drill-types.ts";
import {
  abbreviationAtomId,
  clearLearningEventsForMode,
  parseAbbreviationAtomId,
  readEvents,
  recordLearningEvent,
  safeReadJsonArray,
  type LearningEvent,
} from "./learning-events.ts";

const LEGACY_KEY = "roc-trainer:abbreviation-stats";

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

function readLegacy(): AbbrAttemptEvent[] {
  return safeReadJsonArray(LEGACY_KEY, isAttempt);
}

function abbreviationFromEvent(event: LearningEvent): AbbrAttemptEvent | null {
  if (event.mode !== "abbreviation") return null;
  const parsed = parseAbbreviationAtomId(event.atomId);
  if (!parsed) return null;
  return { abbr: parsed.abbr, direction: parsed.direction, correct: event.correct, ts: event.ts };
}

export function recordAbbreviationAttempt(event: AbbrAttemptEvent): void {
  recordLearningEvent({
    v: 1,
    atomId: abbreviationAtomId(event.abbr, event.direction),
    mode: "abbreviation",
    correct: event.correct,
    ts: event.ts,
    meta: { direction: event.direction },
  });
}

export function clearAbbreviationStats(): void {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode / quota — stats are not load-bearing */
  }
  clearLearningEventsForMode("abbreviation");
}

export function getAbbreviationAggregates(): AbbrAggregate[] {
  const legacy = readLegacy();
  const fromUnified = readEvents()
    .map(abbreviationFromEvent)
    .filter((e): e is AbbrAttemptEvent => e !== null);
  const all = [...legacy, ...fromUnified];

  const grouped = new Map<string, AbbrAttemptEvent[]>();
  for (const ev of all) {
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
