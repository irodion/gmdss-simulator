import { getAbbreviation } from "./abbreviation-mode.ts";
import type { AbbreviationDirection, DrillResult, DrillType, NumberFormat } from "./drill-types.ts";
import { PHONETIC_REVERSE } from "./drill-types.ts";

export type LearningMode =
  | "phonetic"
  | "reverse"
  | "number-pronunciation"
  | "abbreviation"
  | "procedures";

export interface LearningEventMeta {
  readonly rubricId?: string;
  readonly scenarioId?: string;
  /**
   * Stable id shared by every event written from one recordAttempt call.
   * Procedures fan out 5 dimension events per attempt; the façade buckets
   * by attemptId to count attempts without relying on millisecond-precise
   * timestamps (which collide in fast tests and could collide in real use
   * if two attempts ever land in the same ms).
   */
  readonly attemptId?: string;
  readonly direction?: AbbreviationDirection;
  readonly format?: NumberFormat;
  readonly score?: number;
  readonly scenarioPassed?: boolean;
  readonly dimensionPasses?: Readonly<Record<string, boolean>>;
}

export interface LearningEvent {
  readonly v: 1;
  readonly atomId: string;
  readonly mode: LearningMode;
  readonly correct: boolean;
  readonly ts: number;
  readonly meta?: LearningEventMeta;
}

export const LEARNING_EVENTS_KEY = "roc-trainer:learning-events";
const MAX_EVENTS = 2000;

const KNOWN_MODES: ReadonlySet<LearningMode> = new Set([
  "phonetic",
  "reverse",
  "number-pronunciation",
  "abbreviation",
  "procedures",
]);

function isLearningEvent(value: unknown): value is LearningEvent {
  if (value === null || typeof value !== "object") return false;
  const ev = value as Record<string, unknown>;
  return (
    ev["v"] === 1 &&
    typeof ev["atomId"] === "string" &&
    typeof ev["mode"] === "string" &&
    KNOWN_MODES.has(ev["mode"] as LearningMode) &&
    typeof ev["correct"] === "boolean" &&
    typeof ev["ts"] === "number"
  );
}

/**
 * Read a JSON array from localStorage, dropping any entries that don't pass
 * `isT`. Survives missing/corrupt values and unavailable storage. Used by the
 * unified store and by the two legacy-key façades that merge old data on read.
 */
export function safeReadJsonArray<T>(key: string, isT: (v: unknown) => v is T): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isT);
  } catch {
    return [];
  }
}

function safeWrite(events: readonly LearningEvent[]): void {
  try {
    window.localStorage.setItem(LEARNING_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Quota / private-mode errors are silently dropped — stats are not load-bearing.
  }
}

function safeRead(): LearningEvent[] {
  return safeReadJsonArray(LEARNING_EVENTS_KEY, isLearningEvent);
}

export function readEvents(): LearningEvent[] {
  return safeRead();
}

export function recordLearningEvent(event: LearningEvent): void {
  const events = safeRead();
  events.push(event);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  safeWrite(trimmed);
}

export function recordLearningEvents(batch: readonly LearningEvent[]): void {
  if (batch.length === 0) return;
  const events = safeRead();
  events.push(...batch);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  safeWrite(trimmed);
}

export function clearLearningEventsForMode(mode: LearningMode): void {
  const events = safeRead().filter((e) => e.mode !== mode);
  safeWrite(events);
}

export function clearAllLearningEvents(): void {
  safeWrite([]);
}

// ---------- atom id helpers ----------

export function phoneticAtomId(letter: string): string {
  return `phon:${letter.toUpperCase()}`;
}

export function listenAtomId(letter: string): string {
  return `lstn:${letter.toUpperCase()}`;
}

export function numberAtomId(format: NumberFormat): string {
  return `num:${format}`;
}

export function abbreviationAtomId(abbr: string, direction: AbbreviationDirection): string {
  return `abbr:${abbr}:${direction}`;
}

export function procedureAtomId(rubricId: string, dimension: string): string {
  return `proc:${rubricId}:${dimension}`;
}

// ---------- atom id parsers (paired with the minters above) ----------

const ABBR_PREFIX = "abbr:";
const NUM_PREFIX = "num:";

export function parseAbbreviationAtomId(
  atomId: string,
): { abbr: string; direction: AbbreviationDirection } | null {
  if (!atomId.startsWith(ABBR_PREFIX)) return null;
  const lastColon = atomId.lastIndexOf(":");
  if (lastColon <= ABBR_PREFIX.length) return null;
  const direction = atomId.slice(lastColon + 1);
  if (direction !== "abbr-to-expansion" && direction !== "expansion-to-abbr") return null;
  const abbr = atomId.slice(ABBR_PREFIX.length, lastColon);
  if (!abbr) return null;
  return { abbr, direction };
}

export function parseNumberAtomId(atomId: string): NumberFormat | null {
  if (!atomId.startsWith(NUM_PREFIX)) return null;
  const format = atomId.slice(NUM_PREFIX.length);
  if (format === "position" || format === "bearing" || format === "time" || format === "channel") {
    return format;
  }
  return null;
}

// ---------- per-mode emitters ----------

function emitPhonetic(result: DrillResult, ts: number): void {
  const batch: LearningEvent[] = [];
  for (const word of result.matchedWords) {
    const letter = PHONETIC_REVERSE[word];
    if (letter) {
      batch.push({ v: 1, atomId: phoneticAtomId(letter), mode: "phonetic", correct: true, ts });
    }
  }
  for (const word of result.missedWords) {
    const letter = PHONETIC_REVERSE[word];
    if (letter) {
      batch.push({ v: 1, atomId: phoneticAtomId(letter), mode: "phonetic", correct: false, ts });
    }
  }
  recordLearningEvents(batch);
}

function emitReverse(result: DrillResult, ts: number): void {
  const batch: LearningEvent[] = [];
  for (const ch of result.matchedWords) {
    batch.push({ v: 1, atomId: listenAtomId(ch), mode: "reverse", correct: true, ts });
  }
  for (const ch of result.missedWords) {
    batch.push({ v: 1, atomId: listenAtomId(ch), mode: "reverse", correct: false, ts });
  }
  recordLearningEvents(batch);
}

function emitNumber(result: DrillResult, ts: number): void {
  const format = result.challenge.format;
  if (!format) {
    console.warn("[learning-events] number-pronunciation challenge missing format tag", {
      challengeId: result.challenge.id,
    });
    return;
  }
  recordLearningEvent({
    v: 1,
    atomId: numberAtomId(format),
    mode: "number-pronunciation",
    correct: result.score === 100,
    ts,
    meta: { format, score: result.score },
  });
}

function emitAbbreviation(result: DrillResult, ts: number): void {
  const direction = result.challenge.direction;
  if (!direction) return;
  const abbr = getAbbreviation(result.challenge);
  if (!abbr) return;
  recordLearningEvent({
    v: 1,
    atomId: abbreviationAtomId(abbr, direction),
    mode: "abbreviation",
    correct: result.score === 100,
    ts,
    meta: { direction },
  });
}

// ---------- dispatcher ----------

export function recordDrillAttempt(mode: DrillType, result: DrillResult): void {
  const ts = Date.now();
  switch (mode) {
    case "phonetic":
      return emitPhonetic(result, ts);
    case "reverse":
      return emitReverse(result, ts);
    case "number-pronunciation":
      return emitNumber(result, ts);
    case "abbreviation":
      return emitAbbreviation(result, ts);
  }
}
