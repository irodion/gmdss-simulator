import type { RubricDefinition } from "@gmdss-simulator/utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { loadRubric, loadScriptDrillContent } from "./content-loader.ts";

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

  test("loadScriptDrillContent loads the structural rubric", async () => {
    const content = await loadScriptDrillContent();
    expect(content.structuralRubric.id).toBe("v1/distress");
  });
});
