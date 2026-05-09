import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import type { LearningEvent } from "../learning-events.ts";
import { pickAdaptiveScenario } from "./adaptive-scenarios.ts";
import type { Scenario, ScenarioBank } from "./types.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function scenario(over: Partial<Scenario>): Scenario {
  return {
    id: "test-id",
    priority: "mayday",
    rubricId: "v1/distress",
    brief: "test brief",
    facts: { vessel: "TEST" },
    ...over,
  };
}

function bank(scenarios: Scenario[]): ScenarioBank {
  return { scenarios };
}

function ev(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    v: 1,
    atomId: "proc:v1/distress:body",
    mode: "procedures",
    correct: false,
    ts: 0,
    ...over,
  };
}

describe("pickAdaptiveScenario", () => {
  test("returns null when bank is empty", () => {
    expect(pickAdaptiveScenario(bank([]), [], null)).toBeNull();
  });

  test("returns the only scenario when bank has one", () => {
    const s = scenario({ id: "only" });
    expect(pickAdaptiveScenario(bank([s]), [], null)).toBe(s);
  });

  test("excludes excludeId when other candidates exist", () => {
    const a = scenario({ id: "a" });
    const b = scenario({ id: "b", rubricId: "v1/urgency" });
    const picked = pickAdaptiveScenario(bank([a, b]), [], "a");
    expect(picked).toBe(b);
  });

  test("falls back to full bank when excludeId removes everything", () => {
    const only = scenario({ id: "only" });
    const picked = pickAdaptiveScenario(bank([only]), [], "only");
    expect(picked).toBe(only);
  });

  test("cold-start picks uniformly (statistical, lenient)", () => {
    const scenarios = ["a", "b", "c"].map((id) => scenario({ id, rubricId: `v1/${id}` }));
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 300; i++) {
      const picked = pickAdaptiveScenario(bank(scenarios), [], null);
      counts[picked!.id] = (counts[picked!.id] ?? 0) + 1;
    }
    for (const id of ["a", "b", "c"]) {
      expect(counts[id]).toBeGreaterThan(50); // ~100 ± slack
    }
  });

  test("weak rubric dominates over a mastered one", () => {
    const weakScenario = scenario({ id: "weak", rubricId: "v1/distress" });
    const masteredScenario = scenario({ id: "mastered", rubricId: "v1/safety" });

    // Make v1/safety mastered (box 5 on every dimension via 4 corrects).
    const events: LearningEvent[] = [];
    let ts = 0;
    for (const dim of ["priority", "vessel", "body", "ending", "procedure"]) {
      for (let i = 0; i < 4; i++) {
        events.push(ev({ atomId: `proc:v1/safety:${dim}`, ts: ++ts, correct: true }));
      }
    }

    let weakPicks = 0;
    for (let i = 0; i < 300; i++) {
      const picked = pickAdaptiveScenario(bank([weakScenario, masteredScenario]), events, null);
      if (picked!.id === "weak") weakPicks++;
    }
    expect(weakPicks).toBeGreaterThan(150); // > 50%
  });
});
