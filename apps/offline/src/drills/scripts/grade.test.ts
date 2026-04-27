import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { gradeAgainst } from "./grade.ts";
import type { SituationalPrompt } from "./types.ts";

const RUBRIC: RubricDefinition = {
  id: "v1/distress",
  version: "1.0.0",
  category: "distress",
  requiredFields: [
    { id: "mayday", label: "MAYDAY signal word", patterns: ["MAYDAY"], required: true },
    { id: "this_is", label: "THIS IS", patterns: ["THIS\\s+IS"], required: true },
    { id: "vessel_name", label: "Own vessel name", patterns: ["BLUE\\s*DUCK"], required: true },
    { id: "position", label: "Position", patterns: ["POSITION"], required: true },
    { id: "nature", label: "Nature of distress", patterns: ["FIRE"], required: true },
    {
      id: "persons",
      label: "Persons on board",
      patterns: ["PERSONS\\s+ON\\s+BOARD"],
      required: true,
    },
  ],
  prowordRules: [
    { id: "mayday", label: "MAYDAY x4", pattern: "MAYDAY", expectedCount: 4 },
    { id: "this_is", label: "THIS IS", pattern: "THIS\\s+IS" },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["mayday", "this_is", "vessel_name", "position", "nature", "persons", "over"],
  },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

const PROMPT: SituationalPrompt = {
  scenarioId: "2.1",
  rubricId: "v1/distress",
  title: "MAYDAY — Fire on Board",
  description: "Fire.",
  task: "Make a MAYDAY call.",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", personsOnBoard: 8 },
  hints: [],
  canonical:
    "MAYDAY MAYDAY MAYDAY, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, POSITION 50N, FIRE, 8 PERSONS ON BOARD, OVER",
  requiredChannel: 16,
  category: "distress",
};

describe("gradeAgainst", () => {
  test("scores the canonical script very high", () => {
    const result = gradeAgainst(PROMPT, RUBRIC, PROMPT.canonical);
    expect(result.breakdown.overall).toBeGreaterThanOrEqual(90);
    expect(result.passed).toBe(true);
  });

  test("flags a sparse transcript with missing required fields", () => {
    const result = gradeAgainst(PROMPT, RUBRIC, "MAYDAY");
    expect(result.breakdown.overall).toBeLessThan(80);
    expect(result.passed).toBe(false);
    const required = result.breakdown.dimensions.find((d) => d.id === "required_fields")!;
    expect(required.missingItems.length).toBeGreaterThan(0);
  });

  test("score is deterministic for the same input", () => {
    const a = gradeAgainst(PROMPT, RUBRIC, PROMPT.canonical);
    const b = gradeAgainst(PROMPT, RUBRIC, PROMPT.canonical);
    expect(a.breakdown.overall).toBe(b.breakdown.overall);
  });
});
