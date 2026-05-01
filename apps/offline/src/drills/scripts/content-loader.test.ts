import type { RubricDefinition } from "@gmdss-simulator/utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { loadRubric, loadScriptDrillContent } from "./content-loader.ts";
import type { ScenarioBank } from "./types.ts";

function rubric(id: string, category: RubricDefinition["category"]): RubricDefinition {
  return {
    id,
    version: "1.0.0",
    category,
    requiredFields: [],
    prowordRules: [],
    sequenceRules: { fieldOrder: [] },
    channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  };
}

const SCENARIOS: ScenarioBank = {
  scenarios: [
    {
      id: "fire-blue-duck",
      priority: "mayday",
      rubricId: "v1/distress",
      brief: "Engine room fire on MV Blue Duck.",
      facts: {
        vessel: "Blue Duck",
        position: "32°05'N 034°45'E",
        nature: "Engine room fire",
      },
    },
  ],
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
  if (url.endsWith("/rubrics/v1/distress.json")) return rubric("v1/distress", "distress");
  if (url.endsWith("/rubrics/v1/urgency.json")) return rubric("v1/urgency", "urgency");
  if (url.endsWith("/rubrics/v1/safety.json")) return rubric("v1/safety", "safety");
  if (url.endsWith("/rubrics/v1/scenarios.json")) return SCENARIOS;
  return null;
}

describe("content-loader", () => {
  test("loadRubric returns the parsed rubric", async () => {
    const r = await loadRubric("v1/distress");
    expect(r.id).toBe("v1/distress");
  });

  test("loadRubric throws when the file is missing", async () => {
    await expect(loadRubric("v1/nope")).rejects.toThrow(/HTTP 404/);
  });

  test("loadScriptDrillContent loads all three rubrics and the scenario bank", async () => {
    const content = await loadScriptDrillContent();
    expect(content.rubrics.mayday.id).toBe("v1/distress");
    expect(content.rubrics.pan_pan.id).toBe("v1/urgency");
    expect(content.rubrics.securite.id).toBe("v1/safety");
    expect(content.scenarios.scenarios).toHaveLength(1);
    expect(content.scenarios.scenarios[0]!.id).toBe("fire-blue-duck");
  });
});
