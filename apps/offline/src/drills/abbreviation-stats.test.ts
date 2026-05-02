import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import {
  clearAbbreviationStats,
  getAbbreviationAggregates,
  recordAbbreviationAttempt,
  type AbbrAttemptEvent,
} from "./abbreviation-stats.ts";

const STORAGE_KEY = "roc-trainer:abbreviation-stats";

function ev(over: Partial<AbbrAttemptEvent> = {}): AbbrAttemptEvent {
  return {
    abbr: "MRCC",
    direction: "abbr-to-expansion",
    correct: true,
    ts: Date.now(),
    ...over,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("recordAbbreviationAttempt + getAbbreviationAggregates", () => {
  test("aggregates events grouped by abbr", () => {
    recordAbbreviationAttempt(ev({ correct: true }));
    recordAbbreviationAttempt(ev({ correct: false }));
    recordAbbreviationAttempt(ev({ abbr: "EPIRB", correct: true }));

    const aggs = getAbbreviationAggregates();
    const byAbbr = new Map(aggs.map((a) => [a.abbr, a]));

    expect(byAbbr.get("MRCC")).toMatchObject({ attempts: 2, correct: 1, pctCorrect: 50 });
    expect(byAbbr.get("EPIRB")).toMatchObject({ attempts: 1, correct: 1, pctCorrect: 100 });
  });

  test("returns empty array when storage is empty", () => {
    expect(getAbbreviationAggregates()).toEqual([]);
  });

  test("clearAbbreviationStats wipes the store", () => {
    recordAbbreviationAttempt(ev());
    clearAbbreviationStats();
    expect(getAbbreviationAggregates()).toEqual([]);
  });

  test("FIFO-caps at 500 events", () => {
    for (let i = 0; i < 600; i++) {
      recordAbbreviationAttempt(ev({ ts: i }));
    }
    const aggs = getAbbreviationAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.attempts).toBe(500);
  });

  test("survives JSON corruption gracefully", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(getAbbreviationAggregates()).toEqual([]);
    recordAbbreviationAttempt(ev());
    expect(getAbbreviationAggregates()).toHaveLength(1);
  });

  test("filters out malformed entries", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([ev(), null, "string", 42, { abbr: "X" }, { ...ev(), direction: "bogus" }]),
    );
    const aggs = getAbbreviationAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.attempts).toBe(1);
  });

  test("survives a localStorage that throws on write", () => {
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordAbbreviationAttempt(ev())).not.toThrow();
    setItem.mockRestore();
  });

  test("lastTs reflects the most recent attempt for an abbr", () => {
    recordAbbreviationAttempt(ev({ ts: 100 }));
    recordAbbreviationAttempt(ev({ ts: 300 }));
    recordAbbreviationAttempt(ev({ ts: 200 }));
    const agg = getAbbreviationAggregates().find((a) => a.abbr === "MRCC");
    expect(agg!.lastTs).toBe(300);
  });
});
