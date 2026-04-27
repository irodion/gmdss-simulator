import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { clearStats, getAggregateFor, getAggregates, recordAttempt } from "./stats.ts";
import type { GradeEvent } from "./types.ts";

function ev(over: Partial<GradeEvent> = {}): GradeEvent {
  return {
    rubricId: "v1/distress",
    mode: "structural",
    key: "v1/distress:next-after:mayday",
    ts: Date.now(),
    correct: true,
    ...over,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("recordAttempt + getAggregates", () => {
  test("aggregates events by (mode, key) with correct counts", () => {
    recordAttempt(ev({ correct: true }));
    recordAttempt(ev({ correct: false }));
    recordAttempt(ev({ correct: true }));
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]).toMatchObject({
      mode: "structural",
      attempts: 3,
      correct: 2,
      pctCorrect: 67,
    });
  });

  test("getAggregateFor returns null when no events match", () => {
    expect(getAggregateFor("structural", "missing")).toBeNull();
  });

  test("FIFO-caps at 200 events", () => {
    for (let i = 0; i < 250; i++) {
      recordAttempt(ev({ ts: i, correct: i % 2 === 0 }));
    }
    const aggs = getAggregates();
    expect(aggs[0]!.attempts).toBe(200);
  });

  test("clearStats wipes the store", () => {
    recordAttempt(ev());
    clearStats();
    expect(getAggregates()).toEqual([]);
  });

  test("survives JSON corruption gracefully", () => {
    window.localStorage.setItem("roc-trainer:procedure-stats", "{not json");
    expect(getAggregates()).toEqual([]);
    // and a write after corruption still works:
    recordAttempt(ev());
    expect(getAggregates()).toHaveLength(1);
  });

  test("survives a localStorage that throws on write (Safari private mode)", () => {
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordAttempt(ev())).not.toThrow();
    setItem.mockRestore();
  });
});
