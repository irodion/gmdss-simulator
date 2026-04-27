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
  sequenceParts: [
    {
      id: "call",
      label: "MAYDAY Call",
      items: [
        { id: "call.mayday", label: "MAYDAY MAYDAY MAYDAY" },
        { id: "call.vessel", label: "Vessel name × 3" },
        { id: "call.id", label: "Callsign / MMSI" },
      ],
    },
    {
      id: "message",
      label: "MAYDAY Message",
      items: [
        { id: "msg.mayday", label: "MAYDAY" },
        { id: "msg.vessel", label: "Vessel name" },
        { id: "msg.position", label: "Position" },
        { id: "msg.nature", label: "Nature of distress" },
        { id: "msg.over", label: "OVER" },
      ],
    },
  ],
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
  test("mirrors rubric.sequenceParts into the template", () => {
    const template = materializeStructural(RUBRIC);
    expect(template.rubricId).toBe("v1/distress");
    expect(template.callLabel).toBe("MAYDAY call");
    expect(template.parts.map((p) => p.id)).toEqual(["call", "message"]);
    expect(template.parts[0]!.items.map((i) => i.id)).toEqual([
      "call.mayday",
      "call.vessel",
      "call.id",
    ]);
    expect(template.parts[1]!.items.at(-1)!.label).toBe("OVER");
  });

  test("throws when sequenceParts is missing", () => {
    const noParts: RubricDefinition = { ...RUBRIC, sequenceParts: undefined };
    expect(() => materializeStructural(noParts)).toThrow(/sequenceParts/);
  });
});

describe("gradeSequence", () => {
  const TEMPLATE = materializeStructural(RUBRIC);
  const callItems = TEMPLATE.parts[0]!.items;
  const msgItems = TEMPLATE.parts[1]!.items;
  const correctMap = (): Map<string, SequenceItem[]> =>
    new Map([
      ["call", [...callItems]],
      ["message", [...msgItems]],
    ]);

  test("all-correct placements pass with full count", () => {
    const grade = gradeSequence(TEMPLATE, correctMap());
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(callItems.length + msgItems.length);
    expect(grade.total).toBe(callItems.length + msgItems.length);
    expect(grade.parts).toHaveLength(2);
    expect(grade.parts[0]!.placements.every((p) => p.correct)).toBe(true);
  });

  test("a swap inside one part drops correctCount by 2 and leaves the other part intact", () => {
    const placements = correctMap();
    const swapped = [...callItems];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    placements.set("call", swapped);
    const grade = gradeSequence(TEMPLATE, placements);
    expect(grade.passed).toBe(false);
    expect(grade.correctCount).toBe(callItems.length + msgItems.length - 2);
    expect(grade.parts[1]!.placements.every((p) => p.correct)).toBe(true);
  });

  test("each wrong placement carries the expected item", () => {
    const placements = correctMap();
    const swapped = [...callItems];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    placements.set("call", swapped);
    const grade = gradeSequence(TEMPLATE, placements);
    const slot0 = grade.parts[0]!.placements[0]!;
    expect(slot0.correct).toBe(false);
    expect(slot0.placed.id).toBe("call.vessel");
    expect(slot0.expected.id).toBe("call.mayday");
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
