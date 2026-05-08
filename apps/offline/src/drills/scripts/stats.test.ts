import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { LEARNING_EVENTS_KEY, readEvents, recordLearningEvent } from "../learning-events.ts";
import { clearStats, getAggregateFor, getAggregates, recordAttempt } from "./stats.ts";
import type { GradeEvent } from "./types.ts";

const LEGACY_KEY = "roc-trainer:procedure-stats";

function ev(over: Partial<GradeEvent> = {}): GradeEvent {
  return {
    rubricId: "v1/distress",
    mode: "scenario",
    key: "v1/scenarios",
    ts: Date.now(),
    correct: true,
    ...over,
  };
}

function fullDimensions(passed: boolean): GradeEvent["dimensionPasses"] {
  return {
    priority: passed,
    vessel: passed,
    body: passed,
    ending: passed,
    procedure: passed,
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
    recordAttempt(ev({ correct: true, dimensionPasses: fullDimensions(true) }));
    recordAttempt(ev({ correct: false, dimensionPasses: fullDimensions(true) }));
    recordAttempt(ev({ correct: true, dimensionPasses: fullDimensions(true) }));
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]).toMatchObject({
      mode: "scenario",
      attempts: 3,
      correct: 2,
      pctCorrect: 67,
    });
  });

  test("getAggregateFor returns null when no events match", () => {
    expect(getAggregateFor("scenario", "missing")).toBeNull();
  });

  test("clearStats wipes the store", () => {
    recordAttempt(ev({ dimensionPasses: fullDimensions(true) }));
    clearStats();
    expect(getAggregates()).toEqual([]);
  });

  test("survives JSON corruption in the legacy store", () => {
    window.localStorage.setItem(LEGACY_KEY, "{not json");
    expect(getAggregates()).toEqual([]);
    recordAttempt(ev({ dimensionPasses: fullDimensions(true) }));
    expect(getAggregates()).toHaveLength(1);
  });

  test("filters out malformed legacy entries", () => {
    const valid = ev();
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([valid, null, "string", 42, { rubricId: "x" }, { ...valid, mode: "bogus" }]),
    );
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.attempts).toBe(1);
  });

  test("legacy 'structural' events are accepted in storage but excluded from scenario aggregates", () => {
    const legacy = { ...ev(), mode: "structural" as const, key: "v1/distress" };
    const current = ev();
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify([legacy, current]));
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.mode).toBe("scenario");
  });

  test("survives a localStorage that throws on write (Safari private mode)", () => {
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordAttempt(ev({ dimensionPasses: fullDimensions(true) }))).not.toThrow();
    setItem.mockRestore();
  });
});

describe("dimension fan-out + scenario-level aggregation", () => {
  test("recordAttempt with all dimensions passing produces 5 unified events sharing one ts", () => {
    recordAttempt(
      ev({
        ts: 12345,
        scenarioId: "fire-blue-duck",
        correct: true,
        dimensionPasses: fullDimensions(true),
      }),
    );
    const events = readEvents().filter((e) => e.mode === "procedures");
    expect(events).toHaveLength(5);
    expect(events.every((e) => e.ts === 12345)).toBe(true);
    expect(events.map((e) => e.atomId).sort()).toEqual([
      "proc:v1/distress:body",
      "proc:v1/distress:ending",
      "proc:v1/distress:priority",
      "proc:v1/distress:procedure",
      "proc:v1/distress:vessel",
    ]);
    expect(events.every((e) => e.meta?.scenarioPassed === true)).toBe(true);
    expect(events.every((e) => e.meta?.scenarioId === "fire-blue-duck")).toBe(true);
  });

  test("per-dimension correct flags reflect the dimensionPasses input", () => {
    recordAttempt(
      ev({
        ts: 1,
        correct: false,
        dimensionPasses: {
          priority: true,
          vessel: false,
          body: true,
          ending: false,
          procedure: true,
        },
      }),
    );
    const events = readEvents();
    const byAtom = new Map(events.map((e) => [e.atomId, e.correct]));
    expect(byAtom.get("proc:v1/distress:priority")).toBe(true);
    expect(byAtom.get("proc:v1/distress:vessel")).toBe(false);
    expect(byAtom.get("proc:v1/distress:body")).toBe(true);
    expect(byAtom.get("proc:v1/distress:ending")).toBe(false);
    expect(byAtom.get("proc:v1/distress:procedure")).toBe(true);
  });

  test("scenario-level aggregate uses meta.scenarioPassed, not 'all dimensions passed'", () => {
    // Scenario passed (above threshold) even though one dimension failed.
    recordAttempt(
      ev({
        ts: 1,
        correct: true,
        dimensionPasses: {
          priority: true,
          vessel: false, // dimension fail
          body: true,
          ending: true,
          procedure: true,
        },
      }),
    );
    const agg = getAggregateFor("scenario", "v1/scenarios");
    expect(agg).toMatchObject({ attempts: 1, correct: 1, pctCorrect: 100 });
  });

  test("each attempt mints its own attemptId — 3 calls produce attempts=3", () => {
    recordAttempt(ev({ ts: 1, correct: true, dimensionPasses: fullDimensions(true) }));
    recordAttempt(ev({ ts: 2, correct: false, dimensionPasses: fullDimensions(false) }));
    recordAttempt(ev({ ts: 3, correct: true, dimensionPasses: fullDimensions(true) }));
    const agg = getAggregateFor("scenario", "v1/scenarios");
    expect(agg).toMatchObject({ attempts: 3, correct: 2, pctCorrect: 67 });
  });

  test("attempt without dimensionPasses still produces a scenario-level event", () => {
    recordAttempt(ev({ ts: 1, correct: true }));
    expect(getAggregateFor("scenario", "v1/scenarios")).toMatchObject({
      attempts: 1,
      correct: 1,
    });
  });
});

describe("legacy + unified merge", () => {
  test("legacy procedure events still surface in aggregates", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([
        { rubricId: "v1/distress", mode: "scenario", key: "v1/scenarios", ts: 100, correct: true },
        { rubricId: "v1/distress", mode: "scenario", key: "v1/scenarios", ts: 200, correct: false },
      ]),
    );
    const agg = getAggregateFor("scenario", "v1/scenarios");
    expect(agg).toMatchObject({ attempts: 2, correct: 1 });
  });

  test("aggregates merge legacy attempts and unified-store fan-outs", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([
        { rubricId: "v1/distress", mode: "scenario", key: "v1/scenarios", ts: 100, correct: true },
      ]),
    );
    recordAttempt(ev({ ts: 200, correct: false, dimensionPasses: fullDimensions(false) }));

    const agg = getAggregateFor("scenario", "v1/scenarios");
    expect(agg).toMatchObject({ attempts: 2, correct: 1, pctCorrect: 50 });
  });

  test("clearStats wipes both legacy and unified procedure events", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([
        { rubricId: "v1/distress", mode: "scenario", key: "v1/scenarios", ts: 1, correct: true },
      ]),
    );
    recordAttempt(ev({ dimensionPasses: fullDimensions(true) }));

    clearStats();

    expect(getAggregates()).toEqual([]);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(readEvents().filter((e) => e.mode === "procedures")).toEqual([]);
  });

  test("cross-mode isolation: an abbreviation event in unified store doesn't leak", () => {
    recordLearningEvent({
      v: 1,
      atomId: "abbr:DSC:abbr-to-expansion",
      mode: "abbreviation",
      correct: true,
      ts: 1,
      meta: { direction: "abbr-to-expansion" },
    });
    expect(getAggregateFor("scenario", "v1/scenarios")).toBeNull();
  });

  test("clearStats preserves events of other modes", () => {
    recordLearningEvent({
      v: 1,
      atomId: "phon:A",
      mode: "phonetic",
      correct: true,
      ts: 1,
    });
    recordAttempt(ev({ dimensionPasses: fullDimensions(true) }));

    clearStats();

    const remaining = readEvents();
    expect(remaining.every((e) => e.mode === "phonetic")).toBe(true);
    expect(window.localStorage.getItem(LEARNING_EVENTS_KEY)).not.toBeNull();
  });
});
