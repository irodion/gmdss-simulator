/**
 * Daily goal, ungameable streak, and badge persistence.
 *
 * `applySessionCompletion` is the only mutation entry point. It folds today's
 * items into `byDate`, runs the streak transition (if today's adaptive count
 * just crossed the goal target), and returns a fresh state. The caller
 * persists with `writeDailyProgress`.
 *
 * Streak rules:
 * - Cleared yesterday → +1.
 * - Missed exactly 1 day with a freeze available → +1, freeze applied.
 * - Multi-day gap or freeze on cooldown → reset to 1.
 * - One auto-freeze per 7 days max.
 *
 * "Ungameable" property: only adaptive-mode items count toward the goal.
 * Free Practice items are tracked in `byDate.freeItems` for the dashboard
 * but never trigger streak transitions.
 */

import { daysBetween, getLocalDateKey, previousLocalDateKey } from "../lib/date-utils.ts";

/** @internal storage key — exported for direct test access. */
export const DAILY_PROGRESS_KEY = "roc-trainer:daily-progress";
/** @internal */
export const DEFAULT_GOAL_TARGET = 30;
export const MIN_GOAL_TARGET = 5;
export const MAX_GOAL_TARGET = 200;
/** @internal */
export const FREEZE_COOLDOWN_DAYS = 7;
/** @internal cap on persisted byDate entries. */
export const BY_DATE_CAP = 30;

export interface DayCount {
  readonly adaptiveItems: number;
  readonly freeItems: number;
}

export interface StreakState {
  readonly current: number;
  readonly lastClearedDate: string | null;
  readonly lastFreezeDate: string | null;
}

export interface DailyProgressV1 {
  readonly v: 1;
  readonly dailyGoalTarget: number;
  readonly byDate: Readonly<Record<string, DayCount>>;
  readonly streak: StreakState;
  readonly unlockedBadges: readonly string[];
}

const EMPTY_STATE: DailyProgressV1 = Object.freeze({
  v: 1,
  dailyGoalTarget: DEFAULT_GOAL_TARGET,
  byDate: Object.freeze({}),
  streak: Object.freeze({ current: 0, lastClearedDate: null, lastFreezeDate: null }),
  unlockedBadges: Object.freeze([]),
});

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateKeyOrNull(value: unknown): value is string | null {
  if (value === null) return true;
  return typeof value === "string" && DATE_KEY_RE.test(value);
}

function isDayCount(value: unknown): value is DayCount {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isFinite(v["adaptiveItems"]) &&
    Number.isFinite(v["freeItems"]) &&
    (v["adaptiveItems"] as number) >= 0 &&
    (v["freeItems"] as number) >= 0
  );
}

function isStreakState(value: unknown): value is StreakState {
  if (value === null || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    Number.isInteger(s["current"]) &&
    (s["current"] as number) >= 0 &&
    isDateKeyOrNull(s["lastClearedDate"]) &&
    isDateKeyOrNull(s["lastFreezeDate"])
  );
}

function isDailyProgress(value: unknown): value is DailyProgressV1 {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v["v"] !== 1) return false;
  if (!Number.isInteger(v["dailyGoalTarget"])) return false;
  if (typeof v["byDate"] !== "object" || v["byDate"] === null) return false;
  if (!isStreakState(v["streak"])) return false;
  if (!Array.isArray(v["unlockedBadges"])) return false;
  if (!v["unlockedBadges"].every((b) => typeof b === "string")) return false;
  return Object.values(v["byDate"] as Record<string, unknown>).every(isDayCount);
}

export function readDailyProgress(): DailyProgressV1 {
  try {
    const raw = window.localStorage.getItem(DAILY_PROGRESS_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as unknown;
    return isDailyProgress(parsed) ? parsed : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function writeDailyProgress(state: DailyProgressV1): void {
  try {
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — daily progress is not load-bearing */
  }
}

/**
 * Drop entries older than the most recent N keys (lexicographic sort —
 * "YYYY-MM-DD" sorts chronologically).
 */
function trimByDate(byDate: Record<string, DayCount>): Record<string, DayCount> {
  const keys = Object.keys(byDate).sort();
  if (keys.length <= BY_DATE_CAP) return byDate;
  const kept = keys.slice(-BY_DATE_CAP);
  const out: Record<string, DayCount> = {};
  for (const k of kept) out[k] = byDate[k]!;
  return out;
}

function freezeAvailable(streak: StreakState, today: string): boolean {
  if (streak.lastFreezeDate === null) return true;
  return daysBetween(streak.lastFreezeDate, today) >= FREEZE_COOLDOWN_DAYS;
}

function transitionStreak(prev: StreakState, today: string): StreakState {
  const last = prev.lastClearedDate;
  if (last === null) {
    return { current: 1, lastClearedDate: today, lastFreezeDate: prev.lastFreezeDate };
  }
  const gap = daysBetween(last, today);
  if (gap <= 0) return prev;
  if (gap === 1) {
    return {
      current: prev.current + 1,
      lastClearedDate: today,
      lastFreezeDate: prev.lastFreezeDate,
    };
  }
  if (gap === 2 && freezeAvailable(prev, today)) {
    return {
      current: prev.current + 1,
      lastClearedDate: today,
      lastFreezeDate: previousLocalDateKey(today),
    };
  }
  return { current: 1, lastClearedDate: today, lastFreezeDate: prev.lastFreezeDate };
}

export interface SessionCompletionInput {
  readonly adaptiveItems: number;
  readonly freeItems: number;
  readonly now: number;
}

/**
 * Fold today's session items into the state. Returns a fresh state. Triggers
 * streak transition when today's adaptive count just crosses the goal target
 * AND today wasn't already cleared.
 *
 * @internal exported for direct unit testing of the streak transition rules.
 *           Production callers should use {@link applySessionAndPersist}.
 */
export function applySessionCompletion(
  state: DailyProgressV1,
  input: SessionCompletionInput,
): DailyProgressV1 {
  const today = getLocalDateKey(input.now);
  const prevDay = state.byDate[today] ?? { adaptiveItems: 0, freeItems: 0 };
  const nextDay: DayCount = {
    adaptiveItems: prevDay.adaptiveItems + Math.max(0, input.adaptiveItems),
    freeItems: prevDay.freeItems + Math.max(0, input.freeItems),
  };
  const byDate: Record<string, DayCount> = { ...state.byDate, [today]: nextDay };
  const trimmed = trimByDate(byDate);

  const target = state.dailyGoalTarget;
  const justCrossed =
    prevDay.adaptiveItems < target &&
    nextDay.adaptiveItems >= target &&
    state.streak.lastClearedDate !== today;
  const streak = justCrossed ? transitionStreak(state.streak, today) : state.streak;

  return {
    v: 1,
    dailyGoalTarget: state.dailyGoalTarget,
    byDate: trimmed,
    streak,
    unlockedBadges: state.unlockedBadges,
  };
}

export function setDailyGoalTarget(state: DailyProgressV1, target: number): DailyProgressV1 {
  const clamped = Math.max(MIN_GOAL_TARGET, Math.min(MAX_GOAL_TARGET, Math.round(target)));
  if (clamped === state.dailyGoalTarget) return state;
  return { ...state, dailyGoalTarget: clamped };
}

export function todayCount(state: DailyProgressV1, now: number): DayCount {
  return state.byDate[getLocalDateKey(now)] ?? { adaptiveItems: 0, freeItems: 0 };
}

/**
 * Read state, fold a session, persist, and return the new snapshot. Convenience
 * wrapper for callers that don't need the staged `read → apply → write` shape.
 */
export function applySessionAndPersist(input: SessionCompletionInput): DailyProgressV1 {
  const next = applySessionCompletion(readDailyProgress(), input);
  writeDailyProgress(next);
  return next;
}

const RESET_KEYS: readonly string[] = [
  DAILY_PROGRESS_KEY,
  "roc-trainer:learning-events",
  "roc-trainer:adaptive-enabled",
  "roc-trainer:abbreviation-stats",
  "roc-trainer:procedure-stats",
];

export function resetEverything(): void {
  for (const key of RESET_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
