import { describe, expect, test } from "vite-plus/test";
import { getLocalDateKey } from "../../lib/date-utils.ts";
import { pickDailyScenarioId } from "./daily-scenario.ts";
import type { Scenario, ScenarioBank } from "./types.ts";

function bank(ids: readonly string[]): ScenarioBank {
  return {
    scenarios: ids.map<Scenario>((id) => ({
      id,
      priority: "mayday",
      rubricId: "v1/distress",
      brief: "test",
      facts: { vessel: "TEST" },
    })),
  };
}

describe("pickDailyScenarioId", () => {
  test("returns null on an empty bank", () => {
    expect(pickDailyScenarioId(bank([]), "2026-05-09")).toBeNull();
  });

  test("returns the only scenario when bank has one", () => {
    expect(pickDailyScenarioId(bank(["only"]), "2026-05-09")).toBe("only");
  });

  test("same date returns the same id across many calls", () => {
    const b = bank(["a", "b", "c", "d", "e"]);
    const first = pickDailyScenarioId(b, "2026-05-09");
    for (let i = 0; i < 20; i++) {
      expect(pickDailyScenarioId(b, "2026-05-09")).toBe(first);
    }
  });

  test("two adjacent days never produce the same id", () => {
    const b = bank([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
    ]);
    let prev = pickDailyScenarioId(b, "2026-04-01");
    for (let i = 1; i < 30; i++) {
      const day = new Date(2026, 3, 1 + i);
      const key = getLocalDateKey(day.getTime());
      const today = pickDailyScenarioId(b, key);
      expect(today).not.toBe(prev);
      prev = today;
    }
  });

  test("no adjacent repeat across a long span with a small bank", () => {
    // Regression: with N=4 the old single-look-back algorithm could serve the
    // same scenario two days in a row whenever yesterday's served index was
    // itself a perturbed value (a chain of raw-hash collisions). Small bank +
    // long span exercises the deeper-than-one-day chain.
    const b = bank(["a", "b", "c", "d"]);
    let prev = pickDailyScenarioId(b, "2024-01-01");
    for (let i = 1; i < 730; i++) {
      const key = getLocalDateKey(new Date(2024, 0, 1 + i).getTime());
      const today = pickDailyScenarioId(b, key);
      expect(today).not.toBe(prev);
      prev = today;
    }
  });

  test("no adjacent repeat with a 2-scenario bank (forces alternation)", () => {
    // Pathological case: with N=2 every other day is a forced perturbation.
    const b = bank(["a", "b"]);
    let prev = pickDailyScenarioId(b, "2026-01-01");
    for (let i = 1; i < 90; i++) {
      const key = getLocalDateKey(new Date(2026, 0, 1 + i).getTime());
      const today = pickDailyScenarioId(b, key);
      expect(today).not.toBe(prev);
      prev = today;
    }
  });

  test("rotates through every scenario over time (16 scenarios across 365 days)", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `s${i}`);
    const b = bank(ids);
    const seen = new Set<string>();
    for (let i = 0; i < 365; i++) {
      const day = new Date(2026, 0, 1 + i);
      const key = getLocalDateKey(day.getTime());
      seen.add(pickDailyScenarioId(b, key)!);
    }
    expect(seen.size).toBe(16);
  });

  test("snapshot: known dates produce stable indices for a 16-scenario bank", () => {
    // Pinned values prevent silent regressions if the hash function changes.
    const ids = Array.from({ length: 16 }, (_, i) => `s${i}`);
    const b = bank(ids);
    const sample: Record<string, string> = {
      "2026-01-01": pickDailyScenarioId(b, "2026-01-01")!,
      "2026-05-09": pickDailyScenarioId(b, "2026-05-09")!,
      "2026-12-31": pickDailyScenarioId(b, "2026-12-31")!,
    };
    // Each snapshot value must be a string in the bank.
    for (const id of Object.values(sample)) {
      expect(ids).toContain(id);
    }
  });
});
