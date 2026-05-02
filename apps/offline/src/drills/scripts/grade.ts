import {
  type DimensionId,
  type DimensionStatus,
  isPriorityItem,
  isProcedureItem,
  PASS_THRESHOLD,
  type SequenceGrade,
  type SequenceItem,
  type SequencePartGrade,
  type SequencePlacementResult,
  type SequenceScoreDimension,
  type SequenceTemplate,
} from "./types.ts";

const ENDING_IDS = ["over", "out", "medico_ends"] as const;
const VESSEL_IDS = ["vessel", "callsign"] as const;

function isEndingItem(id: string): boolean {
  return (ENDING_IDS as readonly string[]).includes(id);
}

function isVesselIdentification(id: string): boolean {
  return (VESSEL_IDS as readonly string[]).includes(id);
}

function status(correct: number, total: number): DimensionStatus {
  if (total === 0) return "pass";
  if (correct === total) return "pass";
  if (correct === 0) return "fail";
  return "partial";
}

function matches(placed: SequenceItem, expected: SequenceItem): boolean {
  return placed.id === expected.id || (expected.acceptableIds?.includes(placed.id) ?? false);
}

interface AlignedPart {
  readonly placements: SequencePlacementResult[];
  readonly missing: SequenceItem[];
  readonly matchedExpectedIds: readonly number[];
}

/**
 * LCS alignment between the student's placements and the expected items for a
 * part. Returns one entry per student placement (in order) annotated with the
 * expected item it aligned with (or null), and the list of expected items that
 * weren't aligned.
 *
 * `match(placed, expected)` is asymmetric: the expected item carries
 * `acceptableIds`, so the predicate must always be called as
 * `match(placed, expected)`, never the reverse.
 */
function alignPart(
  placed: readonly SequenceItem[],
  expected: readonly SequenceItem[],
): AlignedPart {
  const m = placed.length;
  const n = expected.length;
  // dp[i][j] = LCS length of placed[0..i) and expected[0..j)
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (matches(placed[i - 1]!, expected[j - 1]!)) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to recover which (i, j) pairs are matched.
  const matchedExpectedFor: (number | null)[] = Array.from({ length: m }, () => null);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (matches(placed[i - 1]!, expected[j - 1]!) && dp[i]![j] === dp[i - 1]![j - 1]! + 1) {
      matchedExpectedFor[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }

  const matchedExpectedIdsSet = new Set<number>();
  const placements: SequencePlacementResult[] = placed.map((p, idx) => {
    const expIdx = matchedExpectedFor[idx];
    if (expIdx !== null && expIdx !== undefined) {
      matchedExpectedIdsSet.add(expIdx);
      return { placed: p, expected: expected[expIdx]!, correct: true };
    }
    return { placed: p, expected: null, correct: false };
  });

  const missing: SequenceItem[] = [];
  for (let k = 0; k < n; k++) {
    if (!matchedExpectedIdsSet.has(k)) missing.push(expected[k]!);
  }

  return {
    placements,
    missing,
    matchedExpectedIds: Array.from(matchedExpectedIdsSet),
  };
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
  let totalExpected = 0;
  let totalStudent = 0;

  const accs: Record<DimensionId, DimensionAccumulator> = {
    priority: { id: "priority", label: "Priority", correct: 0, total: 0 },
    vessel: { id: "vessel", label: "Vessel identification", correct: 0, total: 0 },
    body: { id: "body", label: "Message body", correct: 0, total: 0 },
    ending: { id: "ending", label: "Ending", correct: 0, total: 0 },
    procedure: { id: "procedure", label: "Procedure", correct: 0, total: 0 },
  };

  for (const part of template.parts) {
    const placements = placementsByPart.get(part.id) ?? [];
    const aligned = alignPart(placements, part.items);

    totalExpected += part.items.length;
    totalStudent += placements.length;

    const matchedSet = new Set(aligned.matchedExpectedIds);
    for (let k = 0; k < part.items.length; k++) {
      const expected = part.items[k]!;
      const acc = pickAccumulator(expected.id, accs);
      acc.total++;
      if (matchedSet.has(k)) {
        acc.correct++;
        correctCount++;
      }
    }

    parts.push({
      partId: part.id,
      placements: aligned.placements,
      missing: aligned.missing,
    });
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

  const denominator = Math.max(totalExpected, totalStudent);
  const score = denominator === 0 ? 1 : correctCount / denominator;
  const extraCount = totalStudent - correctCount;

  return {
    parts,
    correctCount,
    total: totalExpected,
    extraCount,
    score,
    passed: score * 100 >= PASS_THRESHOLD,
    dimensions,
  };
}

function pickAccumulator(
  expectedId: string,
  accs: Record<DimensionId, DimensionAccumulator>,
): DimensionAccumulator {
  if (isPriorityItem(expectedId)) return accs.priority;
  if (isVesselIdentification(expectedId)) return accs.vessel;
  if (isEndingItem(expectedId)) return accs.ending;
  if (isProcedureItem(expectedId)) return accs.procedure;
  return accs.body;
}
