import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { loadRubric, loadScenario, loadScriptDrillContent } from "./content-loader.ts";

const FAKE_RUBRIC: RubricDefinition = {
  id: "v1/distress",
  version: "1.0.0",
  category: "distress",
  requiredFields: [
    { id: "mayday", label: "MAYDAY", patterns: ["MAYDAY"], required: true },
    { id: "over", label: "OVER", patterns: ["OVER"], required: false },
  ],
  prowordRules: [],
  sequenceRules: { fieldOrder: ["mayday", "over"] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

const FAKE_EXAM_RUBRIC: RubricDefinition = { ...FAKE_RUBRIC, id: "v1/exam" };

const FAKE_SCENARIO_2_1: ScenarioDefinition = {
  id: "2.1",
  tier: 2,
  category: "distress",
  title: "Fire",
  description: "",
  stationPersona: "COAST_GUARD_MRCC",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", personsOnBoard: 8 },
  requiredChannel: 16,
  task: "",
  scriptReference: "MAYDAY {{vesselName}} OVER",
  scriptedResponses: [],
  rubricId: "v1/distress",
};

const FAKE_SCENARIO_4_1: ScenarioDefinition = {
  ...FAKE_SCENARIO_2_1,
  id: "4.1",
  tier: 4,
  rubricId: "v1/exam",
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      const u = typeof url === "string" ? url : url.toString();
      const body = pickBody(u);
      if (body == null) {
        return new Response("not found", { status: 404 });
      }
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function pickBody(url: string): unknown {
  if (url.endsWith("/rubrics/v1/distress.json")) return FAKE_RUBRIC;
  if (url.endsWith("/rubrics/v1/exam.json")) return FAKE_EXAM_RUBRIC;
  if (url.endsWith("/scenarios/tier-2/2.1-mayday-fire.json")) return FAKE_SCENARIO_2_1;
  if (url.endsWith("/scenarios/tier-4/4.1-exam-distress.json")) return FAKE_SCENARIO_4_1;
  return null;
}

describe("content-loader", () => {
  test("loadRubric returns the parsed rubric", async () => {
    const r = await loadRubric("v1/distress");
    expect(r.id).toBe("v1/distress");
  });

  test("loadScenario returns the parsed scenario", async () => {
    const s = await loadScenario("tier-2", "2.1-mayday-fire");
    expect(s.id).toBe("2.1");
  });

  test("loadRubric throws when the file is missing", async () => {
    await expect(loadRubric("v1/nope")).rejects.toThrow(/HTTP 404/);
  });

  test("loadScriptDrillContent loads the structural rubric, both scenarios, and pairs each scenario with its rubric", async () => {
    const content = await loadScriptDrillContent();
    expect(content.structuralRubric.id).toBe("v1/distress");
    expect(content.scenarios).toHaveLength(2);
    expect(content.rubricsByScenario.get("2.1")?.id).toBe("v1/distress");
    expect(content.rubricsByScenario.get("4.1")?.id).toBe("v1/exam");
  });
});
