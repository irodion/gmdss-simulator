/**
 * Leitner-box state derivation from the unified event log.
 *
 * Box state is derived on-demand from `LearningEvent[]` rather than persisted
 * separately — the event log is the single source of truth, and the cap
 * (2,000 events) keeps the walk cheap.
 *
 * Cold-start kick: first-time-seen-and-correct lands in box 2 (review), not
 * box 1 (struggling). Pure Leitner would map `0 + correct → 1`, but that
 * over-drills atoms the user already knows. The kick respects "weak = needs
 * work" — only wrong answers and previously-promoted atoms occupy boxes 1–2.
 */

import type { LearningEvent } from "./learning-events.ts";

export type Box = 0 | 1 | 2 | 3 | 4 | 5;

export const NEW_BOX: Box = 0;
export const MAX_BOX: Box = 5;

function nextBox(prev: Box, correct: boolean): Box {
  if (!correct) return 1;
  if (prev === 0) return 2;
  return Math.min(MAX_BOX, prev + 1) as Box;
}

/**
 * Walk every event once, applying transitions per atom. Returns a map only
 * for atoms that have appeared — callers default missing atoms to NEW_BOX
 * via {@link boxFor}.
 *
 * Events are read in insertion order. `recordLearningEvent` always appends,
 * so insertion order matches chronological order without an explicit sort.
 * Out-of-order ts values (clock skew) are handled positionally — the user's
 * later action overrides their earlier one regardless of clock jitter.
 */
export function deriveAllBoxes(events: readonly LearningEvent[]): Map<string, Box> {
  const out = new Map<string, Box>();
  for (const ev of events) {
    const prev = out.get(ev.atomId) ?? NEW_BOX;
    out.set(ev.atomId, nextBox(prev, ev.correct));
  }
  return out;
}

/** Single-atom probe — convenient for ad-hoc per-atom checks in tests. */
export function deriveBox(events: readonly LearningEvent[], atomId: string): Box {
  let box: Box = NEW_BOX;
  for (const ev of events) {
    if (ev.atomId !== atomId) continue;
    box = nextBox(box, ev.correct);
  }
  return box;
}

export function boxFor(boxes: ReadonlyMap<string, Box>, atomId: string): Box {
  return boxes.get(atomId) ?? NEW_BOX;
}

/**
 * Walk events chronologically and return the longest run of consecutive
 * `correct === true` outcomes across the user's entire history. Used by the
 * "Twenty in a row" badge — counts cross-mode, since a perfect-correct streak
 * is a coherent signal regardless of which atom produced each event.
 */
export function deriveMaxCorrectStreak(events: readonly LearningEvent[]): number {
  let longest = 0;
  let current = 0;
  for (const ev of events) {
    if (ev.correct) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}
