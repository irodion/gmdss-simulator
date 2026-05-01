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
    {
      id: "engine-failure",
      priority: "pan_pan",
      rubricId: "v1/urgency",
      brief: "Engine failure.",
      facts: { vessel: "Red Fox", position: "x", nature: "y" },
    },
    {
      id: "container",
      priority: "securite",
      rubricId: "v1/safety",
      brief: "Floating container.",
      facts: { vessel: "Cape Runner", position: "x", nature: "y" },
    },
    {
      id: "sart-albatross",
      priority: "mayday",
      rubricId: "v1/distress-sart",
      brief: "SART activated.",
      facts: { vessel: "Albatross life raft" },
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
  if (url.endsWith("/rubrics/v1/distress-sart.json")) return rubric("v1/distress-sart", "distress");
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

  test("loadScriptDrillContent loads only rubrics referenced by scenarios, keyed by rubric id", async () => {
    const content = await loadScriptDrillContent();
    expect(content.rubrics["v1/distress"]!.id).toBe("v1/distress");
    expect(content.rubrics["v1/urgency"]!.id).toBe("v1/urgency");
    expect(content.rubrics["v1/safety"]!.id).toBe("v1/safety");
    expect(content.rubrics["v1/distress-sart"]!.id).toBe("v1/distress-sart");
    expect(Object.keys(content.rubrics)).toHaveLength(4);
    expect(content.scenarios.scenarios).toHaveLength(4);
  });
});
