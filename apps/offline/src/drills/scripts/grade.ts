import {
  type DimensionId,
  type DimensionStatus,
  isPriorityItem,
  type SequenceGrade,
  type SequenceItem,
  type SequencePartGrade,
  type SequencePlacementResult,
  type SequenceScoreDimension,
  type SequenceTemplate,
} from "./types.ts";

const ENDING_IDS = ["over", "out"] as const;
const VESSEL_ID = "vessel";

function isEndingItem(id: string): boolean {
  return (ENDING_IDS as readonly string[]).includes(id);
}

function status(correct: number, total: number): DimensionStatus {
  if (total === 0) return "pass";
  if (correct === total) return "pass";
  if (correct === 0) return "fail";
  return "partial";
}

interface DimensionAccumulator {
  readonly id: DimensionId;
  readonly label: string;
  correct: number;
  total: number;
}

export function gradeScenario(
  template: SequenceTemplate,
  placementsByPart: ReadonlyMap<string, readonly SequenceItem[]>,
): SequenceGrade {
  const parts: SequencePartGrade[] = [];
  let correctCount = 0;
  let total = 0;

  const accs: Record<DimensionId, DimensionAccumulator> = {
    priority: { id: "priority", label: "Priority", correct: 0, total: 0 },
    vessel: { id: "vessel", label: "Vessel identification", correct: 0, total: 0 },
    body: { id: "body", label: "Message body", correct: 0, total: 0 },
    ending: { id: "ending", label: "Ending", correct: 0, total: 0 },
  };

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

      const acc = pickAccumulator(expected.id, accs);
      acc.total++;
      if (correct) acc.correct++;
    }
    parts.push({ partId: part.id, placements: partResults });
  }

  const dimensions: SequenceScoreDimension[] = (Object.values(accs) as DimensionAccumulator[])
    .filter((a) => a.total > 0)
    .map((a) => ({
      id: a.id,
      label: a.label,
      correct: a.correct,
      total: a.total,
      status: status(a.correct, a.total),
    }));

  return {
    parts,
    correctCount,
    total,
    passed: correctCount === total,
    dimensions,
  };
}

function pickAccumulator(
  expectedId: string,
  accs: Record<DimensionId, DimensionAccumulator>,
): DimensionAccumulator {
  if (isPriorityItem(expectedId)) return accs.priority;
  if (expectedId === VESSEL_ID) return accs.vessel;
  if (isEndingItem(expectedId)) return accs.ending;
  return accs.body;
}
