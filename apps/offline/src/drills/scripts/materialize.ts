import type { RubricDefinition } from "@gmdss-simulator/utils";
import type {
  SequenceGrade,
  SequenceItem,
  SequencePartGrade,
  SequencePlacementResult,
  SequenceTemplate,
  SequenceTemplatePart,
} from "./types.ts";

export function materializeStructural(rubric: RubricDefinition): SequenceTemplate {
  if (!rubric.sequenceParts || rubric.sequenceParts.length === 0) {
    throw new Error(`Rubric ${rubric.id} has no sequenceParts; sequencing drill requires them`);
  }
  const parts: SequenceTemplatePart[] = rubric.sequenceParts.map((part) => ({
    id: part.id,
    label: part.label,
    items: part.items.map((item) => ({ id: item.id, label: item.label })),
  }));
  const heading = parts[0]?.label ?? rubric.id;
  return {
    rubricId: rubric.id,
    callLabel: heading,
    parts,
  };
}

export function gradeSequence(
  template: SequenceTemplate,
  placementsByPart: ReadonlyMap<string, readonly SequenceItem[]>,
): SequenceGrade {
  const parts: SequencePartGrade[] = [];
  let correctCount = 0;
  let total = 0;

  for (const part of template.parts) {
    const placements = placementsByPart.get(part.id) ?? [];
    const partResults: SequencePlacementResult[] = [];
    for (let i = 0; i < part.items.length; i++) {
      const expected = part.items[i]!;
      const placed = placements[i]!;
      const correct = placed.id === expected.id;
      if (correct) correctCount++;
      total++;
      partResults.push({ placed, expected, correct });
    }
    parts.push({ partId: part.id, placements: partResults });
  }

  return {
    parts,
    correctCount,
    total,
    passed: correctCount === total,
  };
}
