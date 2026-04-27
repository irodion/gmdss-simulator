import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { materializeSituational, materializeStructural } from "./materialize.ts";

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
  ],
  prowordRules: [
    { id: "mayday", label: "MAYDAY x4", pattern: "MAYDAY", expectedCount: 4 },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["mayday", "this_is", "vessel_name", "position", "nature", "over"],
  },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

const SCENARIO: ScenarioDefinition = {
  id: "2.1",
  tier: 2,
  category: "distress",
  title: "MAYDAY — Fire on Board",
  description: "Engine room fire.",
  stationPersona: "COAST_GUARD_MRCC",
  vessel: {
    name: "BLUE DUCK",
    callsign: "5BCD2",
    mmsi: "211239680",
    position: "50°06'N 001°12'W",
    personsOnBoard: 8,
  },
  requiredChannel: 16,
  task: "Send DSC then voice MAYDAY.",
  scriptReference:
    "MAYDAY MAYDAY MAYDAY, THIS IS {{vesselName}} {{vesselName}} {{vesselName}}, CALLSIGN {{callsign}}, MMSI {{mmsi}}, POSITION {{position}}, FIRE, {{personsOnBoard}} PERSONS ON BOARD, OVER",
  scriptedResponses: [],
  rubricId: "v1/distress",
  hints: ["Open flip cover", "Press distress 5s"],
};

describe("materializeStructural", () => {
  test("returns one MC question per fieldOrder transition", () => {
    const qs = materializeStructural(RUBRIC);
    expect(qs).toHaveLength(RUBRIC.sequenceRules.fieldOrder.length - 1);
  });
});

describe("materializeSituational", () => {
  test("substitutes scenario.vessel values into scriptReference", () => {
    const out = materializeSituational(SCENARIO);
    expect(out.canonical).toContain("BLUE DUCK BLUE DUCK BLUE DUCK");
    expect(out.canonical).toContain("CALLSIGN 5BCD2");
    expect(out.canonical).toContain("MMSI 211239680");
    expect(out.canonical).toContain("POSITION 50°06'N 001°12'W");
    expect(out.canonical).toContain("8 PERSONS ON BOARD");
  });

  test("leaves no leftover {{...}} placeholders", () => {
    const out = materializeSituational(SCENARIO);
    expect(out.canonical).not.toMatch(/\{\{\w+\}\}/);
  });

  test("preserves scenario metadata for the UI", () => {
    const out = materializeSituational(SCENARIO);
    expect(out.scenarioId).toBe("2.1");
    expect(out.rubricId).toBe("v1/distress");
    expect(out.title).toBe("MAYDAY — Fire on Board");
    expect(out.requiredChannel).toBe(16);
    expect(out.hints).toEqual(["Open flip cover", "Press distress 5s"]);
  });

  test("renders an empty canonical when scriptReference is absent", () => {
    const noScript: ScenarioDefinition = { ...SCENARIO, scriptReference: undefined };
    expect(materializeSituational(noScript).canonical).toBe("");
  });
});
