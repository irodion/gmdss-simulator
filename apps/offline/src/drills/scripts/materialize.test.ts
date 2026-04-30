import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { gradeSequence, materializeStructural } from "./materialize.ts";
import type { SequenceItem } from "./types.ts";

const RUBRIC: RubricDefinition = {
  id: "v1/distress",
  version: "1.0.0",
  category: "distress",
  requiredFields: [
    { id: "mayday", label: "MAYDAY signal word", patterns: ["MAYDAY"], required: true },
    { id: "vessel_name", label: "Own vessel name", patterns: ["BLUE\\s*DUCK"], required: true },
    { id: "position", label: "Position", patterns: ["POSITION"], required: true },
    { id: "nature", label: "Nature of distress", patterns: ["FIRE"], required: true },
  ],
  prowordRules: [
    { id: "mayday", label: "MAYDAY x4", pattern: "MAYDAY", expectedCount: 4 },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["mayday", "vessel_name", "position", "nature", "over"],
  },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Vessel name" },
        { id: "position", label: "Position" },
        { id: "nature", label: "Nature of distress" },
        { id: "assistance", label: "Request immediate assistance" },
        { id: "persons", label: "Persons on board" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
};

describe("materializeStructural", () => {
  test("mirrors rubric.sequenceParts into the template", () => {
    const template = materializeStructural(RUBRIC);
    expect(template.rubricId).toBe("v1/distress");
    expect(template.callLabel).toBe("MAYDAY procedure");
    expect(template.parts.map((p) => p.id)).toEqual(["procedure"]);
    expect(template.parts[0]!.items).toHaveLength(14);
    expect(template.parts[0]!.items.at(0)!.id).toBe("mayday");
    expect(template.parts[0]!.items.at(-1)!.id).toBe("over");
  });

  test("preserves duplicate ids for interchangeable items", () => {
    const template = materializeStructural(RUBRIC);
    const ids = template.parts[0]!.items.map((i) => i.id);
    expect(ids.filter((id) => id === "mayday")).toHaveLength(4);
    expect(ids.filter((id) => id === "vessel")).toHaveLength(4);
  });

  test("throws when sequenceParts is missing", () => {
    const noParts: RubricDefinition = { ...RUBRIC, sequenceParts: undefined };
    expect(() => materializeStructural(noParts)).toThrow(/sequenceParts/);
  });
});

describe("gradeSequence", () => {
  const TEMPLATE = materializeStructural(RUBRIC);
  const items = TEMPLATE.parts[0]!.items;
  const correctMap = (placed: readonly SequenceItem[]): Map<string, SequenceItem[]> =>
    new Map([["procedure", [...placed]]]);

  test("all-correct placements pass with full count", () => {
    const grade = gradeSequence(TEMPLATE, correctMap(items));
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(items.length);
    expect(grade.total).toBe(items.length);
    expect(grade.parts).toHaveLength(1);
    expect(grade.parts[0]!.placements.every((p) => p.correct)).toBe(true);
  });

  test("interchangeable duplicates: any 'mayday' in any 'mayday' slot is correct", () => {
    // Swap the first two MAYDAY items (both id="mayday") — still all correct.
    const swapped = [...items];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    const grade = gradeSequence(TEMPLATE, correctMap(swapped));
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(items.length);
  });

  test("a wrong-id placement drops correctCount and surfaces the expected", () => {
    // Swap slot 6 (callsign) with slot 9 (position) — different ids, so 2 wrong.
    const swapped = [...items];
    [swapped[6], swapped[9]] = [swapped[9]!, swapped[6]!];
    const grade = gradeSequence(TEMPLATE, correctMap(swapped));
    expect(grade.passed).toBe(false);
    expect(grade.correctCount).toBe(items.length - 2);
    const slot6 = grade.parts[0]!.placements[6]!;
    expect(slot6.correct).toBe(false);
    expect(slot6.placed.id).toBe("position");
    expect(slot6.expected.id).toBe("callsign");
  });
});
