import type { RubricDefinition } from "@gmdss-simulator/utils";
import { callLabelForCategory, type MCQuestion } from "./types.ts";

function labelForFieldId(rubric: RubricDefinition, id: string): string | null {
  const field = rubric.requiredFields.find((f) => f.id === id);
  if (field) return field.label;
  const proword = rubric.prowordRules.find((p) => p.id === id);
  return proword ? proword.label : null;
}

/**
 * Deterministic 32-bit hash; lets the same questionId always pick the same
 * distractor set, so the bank is stable across renders without a seeded RNG.
 */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDistractors(pool: string[], count: number, seed: number): string[] {
  const remaining = [...pool];
  const out: string[] = [];
  let s = seed || 1;
  while (out.length < count && remaining.length > 0) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % remaining.length;
    out.push(remaining.splice(idx, 1)[0]!);
  }
  return out;
}

function buildOptions(
  correct: string,
  distractorPool: string[],
  seed: number,
): { options: string[]; correctIndex: number } {
  const distractors = pickDistractors(distractorPool, 3, seed);
  const all = [correct, ...distractors];
  // Stable shuffle keyed on the seed so the correct answer isn't always at index 0.
  let s = seed || 1;
  for (let i = all.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  const correctIndex = all.indexOf(correct);
  return { options: all, correctIndex };
}

export function generateNextAfterQuestions(rubric: RubricDefinition): MCQuestion[] {
  const ordered = rubric.sequenceRules.fieldOrder
    .map((id) => ({ id, label: labelForFieldId(rubric, id) }))
    .filter((entry): entry is { id: string; label: string } => entry.label != null);
  if (ordered.length < 2) return [];

  const callLabel = callLabelForCategory(rubric.category);
  const labels = ordered.map((e) => e.label);
  const out: MCQuestion[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i]!.label;
    const correct = ordered[i + 1]!.label;
    const distractorPool = labels.filter((l) => l !== current && l !== correct);
    const id = `${rubric.id}:next-after:${ordered[i]!.id}`;
    const { options, correctIndex } = buildOptions(correct, distractorPool, hash(id));
    out.push({
      id,
      kind: "next-after",
      rubricId: rubric.id,
      callLabel,
      prompt: `In a ${callLabel}, what comes immediately after “${current}”?`,
      options,
      correctIndex,
    });
  }

  return out;
}
