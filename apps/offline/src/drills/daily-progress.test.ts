import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import {
  applySessionCompletion,
  applySessionAndPersist,
  BY_DATE_CAP,
  DAILY_PROGRESS_KEY,
  DEFAULT_GOAL_TARGET,
  markDailyScenarioComplete,
  markDailyScenarioCompleteAndPersist,
  markExamMockComplete,
  markExamMockCompleteAndPersist,
  readDailyProgress,
  resetEverything,
  setDailyGoalTarget,
  todayCount,
  writeDailyProgress,
  type DailyProgressV1,
} from "./daily-progress.ts";

function localTimestamp(y: number, m: number, d: number, hh = 12): number {
  return new Date(y, m - 1, d, hh).getTime();
}

function freshState(): DailyProgressV1 {
  return readDailyProgress();
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readDailyProgress", () => {
  test("returns the empty state when nothing persisted", () => {
    const s = freshState();
    expect(s.v).toBe(1);
    expect(s.dailyGoalTarget).toBe(DEFAULT_GOAL_TARGET);
    expect(s.byDate).toEqual({});
    expect(s.streak).toEqual({ current: 0, lastClearedDate: null, lastFreezeDate: null });
    expect(s.unlockedBadges).toEqual([]);
  });

  test("survives JSON corruption", () => {
    window.localStorage.setItem(DAILY_PROGRESS_KEY, "{not json");
    expect(readDailyProgress()).toEqual(freshState());
  });

  test("rejects malformed shape (wrong version, missing fields)", () => {
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify({ v: 2 }));
    expect(readDailyProgress()).toEqual(freshState());
  });
});

describe("applySessionCompletion — daily count accumulation", () => {
  test("adaptive items add to today's adaptiveItems", () => {
    const now = localTimestamp(2026, 5, 9);
    const next = applySessionCompletion(freshState(), { adaptiveItems: 10, freeItems: 0, now });
    expect(next.byDate["2026-05-09"]).toEqual({ adaptiveItems: 10, freeItems: 0 });
  });

  test("free items add to today's freeItems but never trigger streak", () => {
    const now = localTimestamp(2026, 5, 9);
    const next = applySessionCompletion(freshState(), { adaptiveItems: 0, freeItems: 50, now });
    expect(next.byDate["2026-05-09"]).toEqual({ adaptiveItems: 0, freeItems: 50 });
    expect(next.streak.current).toBe(0);
  });

  test("two sessions on the same day accumulate", () => {
    const now = localTimestamp(2026, 5, 9);
    const a = applySessionCompletion(freshState(), { adaptiveItems: 10, freeItems: 0, now });
    const b = applySessionCompletion(a, { adaptiveItems: 5, freeItems: 0, now });
    expect(b.byDate["2026-05-09"]?.adaptiveItems).toBe(15);
  });

  test("negative inputs are clamped to 0", () => {
    const now = localTimestamp(2026, 5, 9);
    const next = applySessionCompletion(freshState(), { adaptiveItems: -5, freeItems: -3, now });
    expect(next.byDate["2026-05-09"]).toEqual({ adaptiveItems: 0, freeItems: 0 });
  });
});

describe("applySessionCompletion — streak transitions", () => {
  test("first-ever clear: 0 → 1, lastClearedDate set to today", () => {
    const now = localTimestamp(2026, 5, 9);
    const next = applySessionCompletion(freshState(), { adaptiveItems: 30, freeItems: 0, now });
    expect(next.streak.current).toBe(1);
    expect(next.streak.lastClearedDate).toBe("2026-05-09");
    expect(next.streak.lastFreezeDate).toBeNull();
  });

  test("idempotent: re-crossing the same day doesn't increment", () => {
    const now = localTimestamp(2026, 5, 9);
    const a = applySessionCompletion(freshState(), { adaptiveItems: 30, freeItems: 0, now });
    const b = applySessionCompletion(a, { adaptiveItems: 30, freeItems: 0, now });
    expect(b.streak.current).toBe(1);
  });

  test("yesterday cleared, today cleared → streak += 1", () => {
    const yesterday = localTimestamp(2026, 5, 8);
    const today = localTimestamp(2026, 5, 9);
    const a = applySessionCompletion(freshState(), {
      adaptiveItems: 30,
      freeItems: 0,
      now: yesterday,
    });
    const b = applySessionCompletion(a, { adaptiveItems: 30, freeItems: 0, now: today });
    expect(b.streak.current).toBe(2);
    expect(b.streak.lastClearedDate).toBe("2026-05-09");
  });

  test("missed exactly 1 day with freeze available → +1, freeze applied to yesterday", () => {
    const dayMinus2 = localTimestamp(2026, 5, 7); // gap=2 (cleared 2 days ago = missed 1 day)
    const today = localTimestamp(2026, 5, 9);
    const seed = applySessionCompletion(freshState(), {
      adaptiveItems: 30,
      freeItems: 0,
      now: dayMinus2,
    });
    expect(seed.streak.current).toBe(1);
    const next = applySessionCompletion(seed, { adaptiveItems: 30, freeItems: 0, now: today });
    expect(next.streak.current).toBe(2);
    expect(next.streak.lastClearedDate).toBe("2026-05-09");
    expect(next.streak.lastFreezeDate).toBe("2026-05-08"); // yesterday
  });

  test("missed 1 day with freeze on cooldown → reset to 1", () => {
    const today = localTimestamp(2026, 5, 9);
    const seeded: DailyProgressV1 = {
      v: 1,
      dailyGoalTarget: DEFAULT_GOAL_TARGET,
      byDate: {},
      streak: {
        current: 5,
        lastClearedDate: "2026-05-07", // 2 days ago
        lastFreezeDate: "2026-05-06", // 3 days ago — within 7-day cooldown
      },
      unlockedBadges: [],
    };
    const next = applySessionCompletion(seeded, { adaptiveItems: 30, freeItems: 0, now: today });
    expect(next.streak.current).toBe(1);
    expect(next.streak.lastFreezeDate).toBe("2026-05-06"); // unchanged
  });

  test("missed > 2 days → reset to 1 (freeze cannot bridge multi-day gaps)", () => {
    const today = localTimestamp(2026, 5, 9);
    const seeded: DailyProgressV1 = {
      v: 1,
      dailyGoalTarget: DEFAULT_GOAL_TARGET,
      byDate: {},
      streak: { current: 5, lastClearedDate: "2026-05-04", lastFreezeDate: null },
      unlockedBadges: [],
    };
    const next = applySessionCompletion(seeded, { adaptiveItems: 30, freeItems: 0, now: today });
    expect(next.streak.current).toBe(1);
    expect(next.streak.lastFreezeDate).toBeNull();
  });

  test("freeze available again after 7 days of cooldown", () => {
    const today = localTimestamp(2026, 5, 9);
    const seeded: DailyProgressV1 = {
      v: 1,
      dailyGoalTarget: DEFAULT_GOAL_TARGET,
      byDate: {},
      streak: {
        current: 5,
        lastClearedDate: "2026-05-07",
        lastFreezeDate: "2026-05-02", // 7 days ago — exactly cooled down
      },
      unlockedBadges: [],
    };
    const next = applySessionCompletion(seeded, { adaptiveItems: 30, freeItems: 0, now: today });
    expect(next.streak.current).toBe(6);
    expect(next.streak.lastFreezeDate).toBe("2026-05-08");
  });

  test("not crossing the target does not transition streak", () => {
    const now = localTimestamp(2026, 5, 9);
    const next = applySessionCompletion(freshState(), { adaptiveItems: 10, freeItems: 0, now });
    expect(next.streak.current).toBe(0);
    expect(next.streak.lastClearedDate).toBeNull();
  });

  test("lowering target mid-day with items already past doesn't double-clear", () => {
    const now = localTimestamp(2026, 5, 9);
    // Day 1: cross at 30.
    const a = applySessionCompletion(freshState(), { adaptiveItems: 30, freeItems: 0, now });
    expect(a.streak.current).toBe(1);
    // User lowers target to 10. Today's items are still 30 ≥ 10, but we already crossed.
    const b = setDailyGoalTarget(a, 10);
    const c = applySessionCompletion(b, { adaptiveItems: 5, freeItems: 0, now });
    expect(c.streak.current).toBe(1);
  });
});

describe("byDate cap", () => {
  test(`drops oldest entries beyond ${BY_DATE_CAP}`, () => {
    let state = freshState();
    // Fill 35 distinct days.
    for (let i = 0; i < 35; i++) {
      const ts = localTimestamp(2026, 1, 1 + i);
      state = applySessionCompletion(state, { adaptiveItems: 5, freeItems: 0, now: ts });
    }
    const dates = Object.keys(state.byDate).sort();
    expect(dates).toHaveLength(BY_DATE_CAP);
    expect(dates[0]).toBe("2026-01-06"); // dropped first 5
  });
});

describe("setDailyGoalTarget", () => {
  test("clamps below MIN_GOAL_TARGET", () => {
    const next = setDailyGoalTarget(freshState(), 1);
    expect(next.dailyGoalTarget).toBe(5);
  });

  test("clamps above MAX_GOAL_TARGET", () => {
    const next = setDailyGoalTarget(freshState(), 9999);
    expect(next.dailyGoalTarget).toBe(200);
  });

  test("rounds non-integer", () => {
    const next = setDailyGoalTarget(freshState(), 12.7);
    expect(next.dailyGoalTarget).toBe(13);
  });

  test("returns same reference if value unchanged", () => {
    const a = freshState();
    const b = setDailyGoalTarget(a, DEFAULT_GOAL_TARGET);
    expect(b).toBe(a);
  });
});

describe("todayCount", () => {
  test("returns zeros when today not in byDate", () => {
    const now = localTimestamp(2026, 5, 9);
    expect(todayCount(freshState(), now)).toEqual({ adaptiveItems: 0, freeItems: 0 });
  });

  test("returns the entry when present", () => {
    const now = localTimestamp(2026, 5, 9);
    const state = applySessionCompletion(freshState(), { adaptiveItems: 7, freeItems: 3, now });
    expect(todayCount(state, now)).toEqual({ adaptiveItems: 7, freeItems: 3 });
  });
});

describe("applySessionAndPersist", () => {
  test("persists the result and is observable on next read", () => {
    const now = localTimestamp(2026, 5, 9);
    applySessionAndPersist({ adaptiveItems: 10, freeItems: 0, now });
    const reloaded = readDailyProgress();
    expect(reloaded.byDate["2026-05-09"]?.adaptiveItems).toBe(10);
  });

  test("survives a localStorage that throws on write", () => {
    const now = localTimestamp(2026, 5, 9);
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => applySessionAndPersist({ adaptiveItems: 5, freeItems: 0, now })).not.toThrow();
  });
});

describe("writeDailyProgress", () => {
  test("roundtrips a non-empty state", () => {
    const seeded: DailyProgressV1 = {
      v: 1,
      dailyGoalTarget: 20,
      byDate: { "2026-05-09": { adaptiveItems: 7, freeItems: 0 } },
      streak: { current: 3, lastClearedDate: "2026-05-09", lastFreezeDate: null },
      unlockedBadges: ["phon-toolkit"],
    };
    writeDailyProgress(seeded);
    expect(readDailyProgress()).toEqual(seeded);
  });
});

describe("resetEverything", () => {
  test("clears all five tracked keys", () => {
    window.localStorage.setItem(DAILY_PROGRESS_KEY, "x");
    window.localStorage.setItem("roc-trainer:learning-events", "x");
    window.localStorage.setItem("roc-trainer:adaptive-enabled", "x");
    window.localStorage.setItem("roc-trainer:abbreviation-stats", "x");
    window.localStorage.setItem("roc-trainer:procedure-stats", "x");

    resetEverything();

    expect(window.localStorage.getItem(DAILY_PROGRESS_KEY)).toBeNull();
    expect(window.localStorage.getItem("roc-trainer:learning-events")).toBeNull();
    expect(window.localStorage.getItem("roc-trainer:adaptive-enabled")).toBeNull();
    expect(window.localStorage.getItem("roc-trainer:abbreviation-stats")).toBeNull();
    expect(window.localStorage.getItem("roc-trainer:procedure-stats")).toBeNull();
  });

  test("preserves PWA install and TTS prefs", () => {
    window.localStorage.setItem("roc-trainer:install-dismissed", "1");
    window.localStorage.setItem("gmdss-offline:procedures:tts-enabled", "true");

    resetEverything();

    expect(window.localStorage.getItem("roc-trainer:install-dismissed")).toBe("1");
    expect(window.localStorage.getItem("gmdss-offline:procedures:tts-enabled")).toBe("true");
  });
});

describe("markDailyScenarioComplete / markExamMockComplete", () => {
  test("markDailyScenarioComplete sets the field on first call", () => {
    const next = markDailyScenarioComplete(freshState(), "2026-05-09");
    expect(next.lastDailyScenarioDate).toBe("2026-05-09");
  });

  test("markDailyScenarioComplete is idempotent for same-day calls", () => {
    const a = markDailyScenarioComplete(freshState(), "2026-05-09");
    const b = markDailyScenarioComplete(a, "2026-05-09");
    expect(b).toBe(a);
  });

  test("markDailyScenarioComplete updates when the day rolls over", () => {
    const a = markDailyScenarioComplete(freshState(), "2026-05-09");
    const b = markDailyScenarioComplete(a, "2026-05-10");
    expect(b.lastDailyScenarioDate).toBe("2026-05-10");
  });

  test("markExamMockComplete sets the field independently", () => {
    const next = markExamMockComplete(freshState(), "2026-05-09");
    expect(next.lastExamMockDate).toBe("2026-05-09");
    expect(next.lastDailyScenarioDate).toBeUndefined();
  });

  test("markExamMockComplete is idempotent", () => {
    const a = markExamMockComplete(freshState(), "2026-05-09");
    const b = markExamMockComplete(a, "2026-05-09");
    expect(b).toBe(a);
  });

  test("markDailyScenarioCompleteAndPersist roundtrips through localStorage", () => {
    markDailyScenarioCompleteAndPersist("2026-05-09");
    expect(readDailyProgress().lastDailyScenarioDate).toBe("2026-05-09");
  });

  test("markExamMockCompleteAndPersist roundtrips through localStorage", () => {
    markExamMockCompleteAndPersist("2026-05-09");
    expect(readDailyProgress().lastExamMockDate).toBe("2026-05-09");
  });

  test("applySessionCompletion preserves PR 4 cooldown fields", () => {
    // Regression: previously the function returned a fresh object that omitted
    // lastDailyScenarioDate / lastExamMockDate, so any session after a Daily
    // Scenario or Exam Mock would silently wipe the cooldown.
    const seeded: DailyProgressV1 = {
      ...freshState(),
      lastDailyScenarioDate: "2026-05-09",
      lastExamMockDate: "2026-05-09",
    };
    const next = applySessionCompletion(seeded, {
      adaptiveItems: 5,
      freeItems: 0,
      now: localTimestamp(2026, 5, 9, 14),
    });
    expect(next.lastDailyScenarioDate).toBe("2026-05-09");
    expect(next.lastExamMockDate).toBe("2026-05-09");
  });
});

describe("DailyProgressV1 forward-compat validator", () => {
  test("accepts state without the PR 4 optional fields", () => {
    const stored = {
      v: 1,
      dailyGoalTarget: 30,
      byDate: {},
      streak: { current: 1, lastClearedDate: "2026-05-09", lastFreezeDate: null },
      unlockedBadges: [],
    };
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(stored));
    const read = readDailyProgress();
    expect(read.lastDailyScenarioDate).toBeUndefined();
    expect(read.lastExamMockDate).toBeUndefined();
    expect(read.streak.current).toBe(1);
  });

  test("rejects malformed lastDailyScenarioDate", () => {
    const malformed = {
      v: 1,
      dailyGoalTarget: 30,
      byDate: {},
      streak: { current: 0, lastClearedDate: null, lastFreezeDate: null },
      unlockedBadges: [],
      lastDailyScenarioDate: "not-a-date",
    };
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(malformed));
    expect(readDailyProgress()).toEqual(freshState());
  });

  test("rejects malformed lastExamMockDate", () => {
    const malformed = {
      v: 1,
      dailyGoalTarget: 30,
      byDate: {},
      streak: { current: 0, lastClearedDate: null, lastFreezeDate: null },
      unlockedBadges: [],
      lastExamMockDate: 12345,
    };
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(malformed));
    expect(readDailyProgress()).toEqual(freshState());
  });

  test("accepts null for both new fields", () => {
    const stored = {
      v: 1,
      dailyGoalTarget: 30,
      byDate: {},
      streak: { current: 0, lastClearedDate: null, lastFreezeDate: null },
      unlockedBadges: [],
      lastDailyScenarioDate: null,
      lastExamMockDate: null,
    };
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(stored));
    const read = readDailyProgress();
    expect(read.lastDailyScenarioDate).toBeNull();
    expect(read.lastExamMockDate).toBeNull();
  });
});
