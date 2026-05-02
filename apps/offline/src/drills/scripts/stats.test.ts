import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { clearStats, getAggregateFor, getAggregates, recordAttempt } from "./stats.ts";
import type { GradeEvent } from "./types.ts";

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
      mode: "scenario",
      attempts: 3,
      correct: 2,
      pctCorrect: 67,
    });
  });

  test("getAggregateFor returns null when no events match", () => {
    expect(getAggregateFor("scenario", "missing")).toBeNull();
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
    recordAttempt(ev());
    expect(getAggregates()).toHaveLength(1);
  });

  test("filters out malformed entries instead of crashing", () => {
    const valid = ev();
    window.localStorage.setItem(
      "roc-trainer:procedure-stats",
      JSON.stringify([valid, null, "string", 42, { rubricId: "x" }, { ...valid, mode: "bogus" }]),
    );
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.attempts).toBe(1);
  });

  test("legacy 'structural' events are accepted in storage but excluded from scenario aggregates", () => {
    const legacy = { ...ev(), mode: "structural" as const, key: "v1/distress" };
    const current = ev();
    window.localStorage.setItem("roc-trainer:procedure-stats", JSON.stringify([legacy, current]));
    const aggs = getAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.mode).toBe("scenario");
  });

  test("persists scenarioId and dimensionPasses when provided", () => {
    recordAttempt(
      ev({
        scenarioId: "fire-blue-duck",
        dimensionPasses: {
          priority: true,
          vessel: false,
          body: true,
          ending: true,
          procedure: true,
        },
      }),
    );
    const raw = window.localStorage.getItem("roc-trainer:procedure-stats");
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!) as unknown[];
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      scenarioId: "fire-blue-duck",
      dimensionPasses: {
        priority: true,
        vessel: false,
        body: true,
        ending: true,
        procedure: true,
      },
    });
  });

  test("events with procedure dimension survive the read-back validator", () => {
    recordAttempt(
      ev({
        dimensionPasses: {
          priority: true,
          vessel: true,
          body: true,
          ending: true,
          procedure: true,
        },
      }),
    );
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
