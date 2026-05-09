/**
 * Milestone badges — competence, not compliance.
 *
 * Every condition is derived from the unified event log + Leitner box state.
 * No streak-length badges, no session-count badges; PR 3's six badges are
 * curated to track real ROC-skill milestones for the solo crammer.
 */

import { atomUniverse } from "./atom-universe.ts";
import { boxFor, type Box } from "./leitner.ts";
import { type LearningEvent, procedureAtomId } from "./learning-events.ts";
import { KNOWN_DIMENSIONS } from "./scripts/types.ts";

export interface Badge {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  readonly events: readonly LearningEvent[];
  readonly boxes: ReadonlyMap<string, Box>;
  readonly maxCorrectStreak: number;
}

/** Rubric ID prefix for Mayday (distress) procedures. Heuristic on the v1 content set. */
const MAYDAY_RUBRIC_PREFIX = "v1/distress";

function everyAtomInBoxAtLeast(
  ctx: BadgeContext,
  mode: Parameters<typeof atomUniverse>[0],
  minBox: Box,
): boolean {
  const universe = atomUniverse(mode);
  if (universe.length === 0) return false;
  for (const atomId of universe) {
    if (boxFor(ctx.boxes, atomId) < minBox) return false;
  }
  return true;
}

export const BADGES: readonly Badge[] = [
  {
    id: "phon-toolkit",
    label: "Phonetic toolkit",
    description: "Every phonetic letter at box 3 or higher.",
    check: (ctx) => everyAtomInBoxAtLeast(ctx, "phonetic", 3),
  },
  {
    id: "listen-sharp-ear",
    label: "Sharp ear",
    description: "Every Listen letter at box 3 or higher.",
    check: (ctx) => everyAtomInBoxAtLeast(ctx, "reverse", 3),
  },
  {
    id: "num-bench",
    label: "Number bench",
    description: "All four number formats mastered (box 5).",
    check: (ctx) => everyAtomInBoxAtLeast(ctx, "number-pronunciation", 5),
  },
  {
    id: "abbr-vocabulary",
    label: "Vocabulary",
    description: "Every abbreviation attempted at least once.",
    check: (ctx) => {
      const universe = atomUniverse("abbreviation");
      const seen = new Set<string>();
      for (const ev of ctx.events) {
        if (ev.mode === "abbreviation") seen.add(ev.atomId);
      }
      return universe.every((atomId) => seen.has(atomId));
    },
  },
  {
    id: "proc-mayday-master",
    label: "Mayday master",
    description: "Every Mayday rubric attempted with every dimension passed.",
    check: (ctx) => {
      const maydayRubrics = new Set<string>();
      const correctByAtom = new Set<string>();
      for (const ev of ctx.events) {
        if (ev.mode !== "procedures") continue;
        const rubricId = ev.meta?.rubricId;
        if (rubricId?.startsWith(MAYDAY_RUBRIC_PREFIX)) maydayRubrics.add(rubricId);
        if (ev.correct) correctByAtom.add(ev.atomId);
      }
      if (maydayRubrics.size === 0) return false;
      for (const rubricId of maydayRubrics) {
        for (const dim of KNOWN_DIMENSIONS) {
          if (!correctByAtom.has(procedureAtomId(rubricId, dim))) return false;
        }
      }
      return true;
    },
  },
  {
    id: "combo-twenty-streak",
    label: "Twenty in a row",
    description: "Twenty consecutive correct answers across any mode.",
    check: (ctx) => ctx.maxCorrectStreak >= 20,
  },
];

/** Returns the IDs of every badge whose unlock condition is currently satisfied. */
export function evaluateBadges(ctx: BadgeContext): string[] {
  return BADGES.filter((b) => b.check(ctx)).map((b) => b.id);
}
