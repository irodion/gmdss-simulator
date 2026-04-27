import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { generateNextAfterQuestions } from "./checkpoint-gen.ts";

const FIXTURE: RubricDefinition = {
  id: "v1/test",
  version: "1.0.0",
  category: "distress",
  requiredFields: [
    { id: "mayday", label: "MAYDAY signal word", patterns: ["MAYDAY"], required: true },
    { id: "this_is", label: "THIS IS", patterns: ["THIS\\s+IS"], required: true },
    { id: "vessel", label: "Own vessel name", patterns: ["NAME"], required: true },
    { id: "callsign", label: "Callsign or MMSI", patterns: ["CALL"], required: true },
    { id: "position", label: "Position", patterns: ["POS"], required: true },
  ],
  prowordRules: [
    { id: "mayday", label: "MAYDAY x4", pattern: "MAYDAY", expectedCount: 4 },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["mayday", "this_is", "vessel", "callsign", "position", "over"],
  },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

describe("generateNextAfterQuestions", () => {
  test("produces N - 1 questions for N ordered elements", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    expect(qs).toHaveLength(FIXTURE.sequenceRules.fieldOrder.length - 1);
  });

  test("each question's correct option is the label of the next field", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    const labels = [
      "MAYDAY signal word",
      "THIS IS",
      "Own vessel name",
      "Callsign or MMSI",
      "Position",
      "OVER",
    ];
    qs.forEach((q, i) => {
      expect(q.options[q.correctIndex]).toBe(labels[i + 1]);
    });
  });

  test("each question's prompt mentions the current field's label and the call type", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    expect(qs[0]!.prompt).toContain("MAYDAY signal word");
    expect(qs[0]!.prompt).toContain("MAYDAY call");
  });

  test("distractors never include the question's own label or the correct answer", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    for (const q of qs) {
      const correct = q.options[q.correctIndex]!;
      const others = q.options.filter((_, i) => i !== q.correctIndex);
      // The question's "current" label is the part of the prompt between curly quotes.
      const match = q.prompt.match(/“([^”]+)”/);
      expect(match).not.toBeNull();
      const current = match![1]!;
      expect(others).not.toContain(correct);
      expect(others).not.toContain(current);
    }
  });

  test("output is deterministic for the same rubric", () => {
    const a = generateNextAfterQuestions(FIXTURE);
    const b = generateNextAfterQuestions(FIXTURE);
    expect(a).toEqual(b);
  });

  test("each question has 4 options", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
    }
  });

  test("returns empty when fewer than 2 ordered elements have known labels", () => {
    const tiny: RubricDefinition = {
      ...FIXTURE,
      sequenceRules: { fieldOrder: ["mayday"] },
    };
    expect(generateNextAfterQuestions(tiny)).toHaveLength(0);
  });

  test("question ids embed the rubric id and the source field id", () => {
    const qs = generateNextAfterQuestions(FIXTURE);
    expect(qs[0]!.id).toBe("v1/test:next-after:mayday");
    expect(qs[1]!.id).toBe("v1/test:next-after:this_is");
  });
});
