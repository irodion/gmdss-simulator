import { describe, expect, test } from "vite-plus/test";
import { atomUniverse } from "./atom-universe.ts";
import { BADGES, evaluateBadges, type BadgeContext } from "./badges.ts";
import type { Box } from "./leitner.ts";
import { phoneticAtomId, procedureAtomId, type LearningEvent } from "./learning-events.ts";
import { KNOWN_DIMENSIONS } from "./scripts/types.ts";

function ctx(over: Partial<BadgeContext> = {}): BadgeContext {
  return {
    events: [],
    boxes: new Map<string, Box>(),
    maxCorrectStreak: 0,
    ...over,
  };
}

function ev(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    v: 1,
    atomId: phoneticAtomId("A"),
    mode: "phonetic",
    correct: true,
    ts: 0,
    ...over,
  };
}

function boxesFor(atomIds: readonly string[], box: Box): Map<string, Box> {
  return new Map(atomIds.map((a) => [a, box]));
}

describe("BADGES catalog", () => {
  test("contains exactly six entries with unique ids", () => {
    expect(BADGES).toHaveLength(6);
    const ids = new Set(BADGES.map((b) => b.id));
    expect(ids.size).toBe(6);
  });
});

describe("evaluateBadges — empty events", () => {
  test("no badges unlocked from empty state", () => {
    expect(evaluateBadges(ctx())).toEqual([]);
  });
});

describe("phon-toolkit", () => {
  test("locked when one phonetic atom is below box 3", () => {
    const universe = atomUniverse("phonetic");
    const boxes = boxesFor(universe, 3);
    boxes.set(universe[0]!, 2);
    expect(evaluateBadges(ctx({ boxes }))).not.toContain("phon-toolkit");
  });

  test("unlocked when every phonetic atom is at box 3+", () => {
    const boxes = boxesFor(atomUniverse("phonetic"), 3);
    expect(evaluateBadges(ctx({ boxes }))).toContain("phon-toolkit");
  });
});

describe("listen-sharp-ear", () => {
  test("locked when a Listen atom is below box 3", () => {
    const universe = atomUniverse("reverse");
    const boxes = boxesFor(universe, 3);
    boxes.set(universe[0]!, 1);
    expect(evaluateBadges(ctx({ boxes }))).not.toContain("listen-sharp-ear");
  });

  test("unlocked when every Listen atom is at box 3+", () => {
    const boxes = boxesFor(atomUniverse("reverse"), 4);
    expect(evaluateBadges(ctx({ boxes }))).toContain("listen-sharp-ear");
  });
});

describe("num-bench", () => {
  test("locked when one number format is below box 5", () => {
    const boxes = boxesFor(atomUniverse("number-pronunciation"), 5);
    boxes.set("num:position", 4);
    expect(evaluateBadges(ctx({ boxes }))).not.toContain("num-bench");
  });

  test("unlocked when all four formats reach box 5", () => {
    const boxes = boxesFor(atomUniverse("number-pronunciation"), 5);
    expect(evaluateBadges(ctx({ boxes }))).toContain("num-bench");
  });
});

describe("abbr-vocabulary", () => {
  test("locked when at least one abbreviation atom has no event", () => {
    const universe = atomUniverse("abbreviation");
    const events = universe
      .slice(0, universe.length - 1)
      .map((atomId, i) => ev({ atomId, mode: "abbreviation", ts: i }));
    expect(evaluateBadges(ctx({ events }))).not.toContain("abbr-vocabulary");
  });

  test("unlocked when every abbreviation atom has at least one event", () => {
    const events = atomUniverse("abbreviation").map((atomId, i) =>
      ev({ atomId, mode: "abbreviation", ts: i }),
    );
    expect(evaluateBadges(ctx({ events }))).toContain("abbr-vocabulary");
  });
});

describe("proc-mayday-master", () => {
  test("locked when no Mayday rubric was ever attempted", () => {
    const events: LearningEvent[] = KNOWN_DIMENSIONS.map((dim, i) => ({
      v: 1,
      atomId: procedureAtomId("v1/safety", dim),
      mode: "procedures",
      correct: true,
      ts: i,
      meta: { rubricId: "v1/safety", attemptId: "a1" },
    }));
    expect(evaluateBadges(ctx({ events }))).not.toContain("proc-mayday-master");
  });

  test("locked when a Mayday rubric has a missing dimension", () => {
    const events: LearningEvent[] = KNOWN_DIMENSIONS.slice(0, 4).map((dim, i) => ({
      v: 1,
      atomId: procedureAtomId("v1/distress", dim),
      mode: "procedures",
      correct: true,
      ts: i,
      meta: { rubricId: "v1/distress", attemptId: "a1" },
    }));
    expect(evaluateBadges(ctx({ events }))).not.toContain("proc-mayday-master");
  });

  test("unlocked when every Mayday rubric has every dimension correct", () => {
    const events: LearningEvent[] = KNOWN_DIMENSIONS.map((dim, i) => ({
      v: 1,
      atomId: procedureAtomId("v1/distress", dim),
      mode: "procedures",
      correct: true,
      ts: i,
      meta: { rubricId: "v1/distress", attemptId: "a1" },
    }));
    expect(evaluateBadges(ctx({ events }))).toContain("proc-mayday-master");
  });

  test("ignores non-Mayday rubrics", () => {
    const events: LearningEvent[] = [
      // Mayday: all five dimensions correct.
      ...KNOWN_DIMENSIONS.map((dim, i) => ({
        v: 1 as const,
        atomId: procedureAtomId("v1/distress", dim),
        mode: "procedures" as const,
        correct: true,
        ts: i,
        meta: { rubricId: "v1/distress", attemptId: "a1" },
      })),
      // Urgency rubric with one missing — should NOT block the Mayday badge.
      {
        v: 1,
        atomId: procedureAtomId("v1/urgency", "priority"),
        mode: "procedures",
        correct: false,
        ts: 99,
        meta: { rubricId: "v1/urgency", attemptId: "a2" },
      },
    ];
    expect(evaluateBadges(ctx({ events }))).toContain("proc-mayday-master");
  });
});

describe("combo-twenty-streak", () => {
  test("locked at maxCorrectStreak=19", () => {
    expect(evaluateBadges(ctx({ maxCorrectStreak: 19 }))).not.toContain("combo-twenty-streak");
  });

  test("unlocked at maxCorrectStreak=20", () => {
    expect(evaluateBadges(ctx({ maxCorrectStreak: 20 }))).toContain("combo-twenty-streak");
  });

  test("unlocked beyond 20", () => {
    expect(evaluateBadges(ctx({ maxCorrectStreak: 100 }))).toContain("combo-twenty-streak");
  });
});
