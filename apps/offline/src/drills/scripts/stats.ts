import {
  clearLearningEventsForMode,
  procedureAtomId,
  readEvents,
  recordLearningEvents,
  safeReadJsonArray,
  type LearningEvent,
} from "../learning-events.ts";
import {
  SCENARIO_STATS_KEY,
  type DimensionId,
  type GradeEvent,
  type ScriptDrillMode,
} from "./types.ts";

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

const LEGACY_KEY = "roc-trainer:procedure-stats";

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

/**
 * Synthetic dimension key used when an attempt has no dimensionPasses to fan
 * out. Carries the scenario-level pass through to the unified store. Filter
 * this value out when computing per-dimension queue signal in later PRs.
 */
const ATTEMPT_DIMENSION = "_attempt";

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

function readLegacy(): StoredEvent[] {
  return safeReadJsonArray(LEGACY_KEY, isStoredEvent);
}

function newAttemptId(ts: number): string {
  return `${ts}-${crypto.randomUUID()}`;
}

export function recordAttempt(event: GradeEvent): void {
  const dimensionPasses = event.dimensionPasses;
  const attemptId = newAttemptId(event.ts);
  const batch: LearningEvent[] = [];

  if (dimensionPasses) {
    for (const dim of KNOWN_DIMENSIONS) {
      const passed = dimensionPasses[dim];
      if (typeof passed !== "boolean") continue;
      batch.push({
        v: 1,
        atomId: procedureAtomId(event.rubricId, dim),
        mode: "procedures",
        correct: passed,
        ts: event.ts,
        meta: {
          rubricId: event.rubricId,
          ...(event.scenarioId !== undefined ? { scenarioId: event.scenarioId } : {}),
          attemptId,
          scenarioPassed: event.correct,
        },
      });
    }
  }

  if (batch.length === 0) {
    batch.push({
      v: 1,
      atomId: procedureAtomId(event.rubricId, ATTEMPT_DIMENSION),
      mode: "procedures",
      correct: event.correct,
      ts: event.ts,
      meta: {
        rubricId: event.rubricId,
        ...(event.scenarioId !== undefined ? { scenarioId: event.scenarioId } : {}),
        attemptId,
        scenarioPassed: event.correct,
      },
    });
  }

  recordLearningEvents(batch);
}

export function clearStats(): void {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode / quota — stats are not load-bearing */
  }
  clearLearningEventsForMode("procedures");
}

interface AttemptBucket {
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly correct: boolean;
}

function legacyBuckets(events: readonly StoredEvent[]): AttemptBucket[] {
  return events
    .filter((e) => e.mode === "scenario")
    .map((e) => ({ mode: "scenario" as ScriptDrillMode, key: e.key, correct: e.correct }));
}

function unifiedBuckets(events: readonly LearningEvent[]): AttemptBucket[] {
  // One scenario attempt becomes multiple per-dimension events. Group them by
  // attemptId — a stable id minted once per recordAttempt call.
  const seen = new Set<string>();
  const out: AttemptBucket[] = [];
  for (const [index, ev] of events.entries()) {
    if (ev.mode !== "procedures") continue;
    const passed = ev.meta?.scenarioPassed;
    if (typeof passed !== "boolean") continue;
    // Fallback dedupe key uses the array index too, so distinct attempts
    // sharing a millisecond aren't collapsed when attemptId is missing
    // (only happens for hand-crafted events outside recordAttempt).
    const dedupeKey = ev.meta?.attemptId ?? `_anon|${ev.ts}-${index}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    // The legacy `key` was the StatsKey passed by ProceduresPanel
    // ("v1/scenarios"). It's not on the unified event — ProceduresHome reads
    // aggregates by the legacy key, so reconstruct it from a stable constant.
    out.push({ mode: "scenario", key: SCENARIO_STATS_KEY, correct: passed });
  }
  return out;
}

export function getAggregates(): StatsAggregate[] {
  const buckets = [...legacyBuckets(readLegacy()), ...unifiedBuckets(readEvents())];
  const grouped = new Map<string, AttemptBucket[]>();
  for (const b of buckets) {
    const groupKey = `${b.mode}:${b.key}`;
    const list = grouped.get(groupKey);
    if (list) list.push(b);
    else grouped.set(groupKey, [b]);
  }
  return Array.from(grouped.values()).map((evs) => {
    const correct = evs.filter((e) => e.correct).length;
    return {
      mode: evs[0]!.mode,
      key: evs[0]!.key,
      attempts: evs.length,
      correct,
      pctCorrect: Math.round((correct / evs.length) * 100),
    };
  });
}

export function getAggregateFor(mode: ScriptDrillMode, key: string): StatsAggregate | null {
  return getAggregates().find((a) => a.mode === mode && a.key === key) ?? null;
}
