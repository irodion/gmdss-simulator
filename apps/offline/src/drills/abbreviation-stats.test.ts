import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import {
  clearAbbreviationStats,
  getAbbreviationAggregates,
  recordAbbreviationAttempt,
  type AbbrAttemptEvent,
} from "./abbreviation-stats.ts";
import {
  abbreviationAtomId,
  LEARNING_EVENTS_KEY,
  readEvents,
  recordLearningEvent,
} from "./learning-events.ts";

const LEGACY_KEY = "roc-trainer:abbreviation-stats";

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

  test("writes go to the unified learning-events store, not the legacy key", () => {
    recordAbbreviationAttempt(ev());
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(readEvents()).toHaveLength(1);
  });

  test("survives JSON corruption in the legacy store", () => {
    window.localStorage.setItem(LEGACY_KEY, "{not json");
    expect(getAbbreviationAggregates()).toEqual([]);
    recordAbbreviationAttempt(ev());
    expect(getAbbreviationAggregates()).toHaveLength(1);
  });

  test("filters out malformed entries from the legacy store", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
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

describe("legacy + unified merge", () => {
  test("legacy events still surface in aggregates after migration", () => {
    const legacy: AbbrAttemptEvent[] = [
      { abbr: "DSC", direction: "abbr-to-expansion", correct: true, ts: 100 },
      { abbr: "DSC", direction: "abbr-to-expansion", correct: false, ts: 200 },
    ];
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const aggs = getAbbreviationAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]).toMatchObject({ abbr: "DSC", attempts: 2, correct: 1 });
  });

  test("aggregates merge legacy and unified events for the same abbr", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([{ abbr: "DSC", direction: "abbr-to-expansion", correct: true, ts: 100 }]),
    );
    recordAbbreviationAttempt({
      abbr: "DSC",
      direction: "abbr-to-expansion",
      correct: false,
      ts: 200,
    });

    const aggs = getAbbreviationAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]).toMatchObject({ abbr: "DSC", attempts: 2, correct: 1, pctCorrect: 50 });
  });

  test("events written via recordLearningEvent surface in aggregates", () => {
    recordLearningEvent({
      v: 1,
      atomId: abbreviationAtomId("EPIRB", "expansion-to-abbr"),
      mode: "abbreviation",
      correct: true,
      ts: 500,
      meta: { direction: "expansion-to-abbr" },
    });
    const agg = getAbbreviationAggregates().find((a) => a.abbr === "EPIRB");
    expect(agg).toMatchObject({ attempts: 1, correct: 1 });
  });

  test("clearAbbreviationStats wipes both legacy and unified abbreviation events", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([{ abbr: "DSC", direction: "abbr-to-expansion", correct: true, ts: 100 }]),
    );
    recordAbbreviationAttempt(ev());

    clearAbbreviationStats();

    expect(getAbbreviationAggregates()).toEqual([]);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(readEvents().filter((e) => e.mode === "abbreviation")).toEqual([]);
  });

  test("clear preserves events of other modes", () => {
    recordLearningEvent({
      v: 1,
      atomId: "phon:A",
      mode: "phonetic",
      correct: true,
      ts: 100,
    });
    recordAbbreviationAttempt(ev());

    clearAbbreviationStats();

    const remaining = readEvents();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.mode).toBe("phonetic");
    // unified store key untouched
    expect(window.localStorage.getItem(LEARNING_EVENTS_KEY)).not.toBeNull();
  });
});
