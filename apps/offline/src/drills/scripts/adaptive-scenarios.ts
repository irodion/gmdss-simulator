/**
 * Adaptive scenario picking for the Procedures mode.
 *
 * Procedures sessions are single scenarios, not counts. We bias scenario
 * selection by the rubric's mean Leitner box across its 5 dimensions: a
 * scenario whose rubric has been failing recently is more likely to be
 * picked. Cold-start (no events) → uniform random.
 */

import { boxFor, deriveAllBoxes, type Box } from "../leitner.ts";
import type { LearningEvent } from "../learning-events.ts";
import { procedureAtomId } from "../learning-events.ts";
import { KNOWN_DIMENSIONS, type Scenario, type ScenarioBank } from "./types.ts";

function meanRubricBox(rubricId: string, boxes: ReadonlyMap<string, Box>): number {
  let sum = 0;
  for (const dim of KNOWN_DIMENSIONS) {
    sum += boxFor(boxes, procedureAtomId(rubricId, dim));
  }
  return sum / KNOWN_DIMENSIONS.length;
}

export function pickAdaptiveScenario(
  bank: ScenarioBank,
  events: readonly LearningEvent[],
  excludeId: string | null,
): Scenario | null {
  const all = bank.scenarios;
  if (all.length === 0) return null;
  if (all.length === 1) return all[0]!;

  const candidates = excludeId ? all.filter((s) => s.id !== excludeId) : all;
  const pool = candidates.length > 0 ? candidates : all;

  const boxes = deriveAllBoxes(events);
  // Weight = (6 - meanBox) so weak rubrics dominate. At cold-start every
  // mean is 0, weights are all 6 → uniform.
  const weights = pool.map((s) => Math.max(1, 6 - meanRubricBox(s.rubricId, boxes)));
  const total = weights.reduce((sum, w) => sum + w, 0);

  let dart = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    dart -= weights[i]!;
    if (dart <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}
