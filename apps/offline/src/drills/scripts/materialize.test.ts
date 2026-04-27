import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { gradeSequence, materializeSituational, materializeStructural } from "./materialize.ts";
import type { SequenceItem } from "./types.ts";

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
  test("returns a template whose correctOrder matches sequenceRules.fieldOrder", () => {
    const template = materializeStructural(RUBRIC);
    expect(template.rubricId).toBe("v1/distress");
    expect(template.callLabel).toBe("MAYDAY call");
    expect(template.correctOrder.map((s) => s.id)).toEqual([
      "mayday",
      "this_is",
      "vessel_name",
      "position",
      "nature",
      "over",
    ]);
    expect(template.correctOrder[0]!.label).toBe("MAYDAY signal word");
    expect(template.correctOrder.at(-1)!.label).toBe("OVER");
  });

  test("skips fieldOrder ids that have no matching label", () => {
    const orphan: RubricDefinition = {
      ...RUBRIC,
      sequenceRules: { fieldOrder: ["mayday", "ghost", "over"] },
    };
    const template = materializeStructural(orphan);
    expect(template.correctOrder.map((s) => s.id)).toEqual(["mayday", "over"]);
  });
});

describe("gradeSequence", () => {
  const TEMPLATE = materializeStructural(RUBRIC);
  const correct = TEMPLATE.correctOrder;

  test("all-correct order passes with full count", () => {
    const grade = gradeSequence(TEMPLATE, correct);
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(correct.length);
    expect(grade.total).toBe(correct.length);
    expect(grade.placements.every((p) => p.correct)).toBe(true);
  });

  test("swapping two adjacent items drops correctCount by exactly 2", () => {
    const swapped: SequenceItem[] = [...correct];
    [swapped[1], swapped[2]] = [swapped[2]!, swapped[1]!];
    const grade = gradeSequence(TEMPLATE, swapped);
    expect(grade.passed).toBe(false);
    expect(grade.correctCount).toBe(correct.length - 2);
  });

  test("each wrong placement carries the expected item alongside what was placed", () => {
    const swapped: SequenceItem[] = [...correct];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    const grade = gradeSequence(TEMPLATE, swapped);
    expect(grade.placements[0]!.correct).toBe(false);
    expect(grade.placements[0]!.placed.id).toBe("this_is");
    expect(grade.placements[0]!.expected.id).toBe("mayday");
  });

  test("rotation by one yields zero correct placements", () => {
    const rotated = [...correct.slice(1), correct[0]!];
    const grade = gradeSequence(TEMPLATE, rotated);
    expect(grade.correctCount).toBe(0);
    expect(grade.passed).toBe(false);
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
