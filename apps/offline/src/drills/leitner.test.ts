import { describe, expect, test } from "vite-plus/test";
import {
  boxFor,
  deriveAllBoxes,
  deriveBox,
  deriveMaxCorrectStreak,
  MAX_BOX,
  NEW_BOX,
} from "./leitner.ts";
import type { LearningEvent } from "./learning-events.ts";

function ev(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    v: 1,
    atomId: "phon:A",
    mode: "phonetic",
    correct: true,
    ts: 0,
    ...over,
  };
}

describe("deriveBox", () => {
  test("empty event log returns NEW_BOX (0)", () => {
    expect(deriveBox([], "phon:A")).toBe(NEW_BOX);
  });

  test("single wrong answer lands in box 1", () => {
    expect(deriveBox([ev({ ts: 1, correct: false })], "phon:A")).toBe(1);
  });

  test("first correct from cold-start kicks to box 2 (skip box 1)", () => {
    expect(deriveBox([ev({ ts: 1, correct: true })], "phon:A")).toBe(2);
  });

  test("five consecutive correct from cold-start ceiling at MAX_BOX", () => {
    const events = [1, 2, 3, 4, 5].map((ts) => ev({ ts, correct: true }));
    expect(deriveBox(events, "phon:A")).toBe(MAX_BOX);
  });

  test("six consecutive correct still capped at MAX_BOX", () => {
    const events = [1, 2, 3, 4, 5, 6].map((ts) => ev({ ts, correct: true }));
    expect(deriveBox(events, "phon:A")).toBe(MAX_BOX);
  });

  test("any wrong demotes to box 1 regardless of prior box", () => {
    const events = [
      ev({ ts: 1, correct: true }), //  → 2
      ev({ ts: 2, correct: true }), //  → 3
      ev({ ts: 3, correct: true }), //  → 4
      ev({ ts: 4, correct: false }), // → 1
    ];
    expect(deriveBox(events, "phon:A")).toBe(1);
  });

  test("mixed sequence climbs and falls correctly", () => {
    // 0 → 2 (correct kick) → 3 (correct) → 1 (wrong) → 2 (correct kick? no — already in box 1) → 3
    const events = [
      ev({ ts: 1, correct: true }),
      ev({ ts: 2, correct: true }),
      ev({ ts: 3, correct: false }),
      ev({ ts: 4, correct: true }),
      ev({ ts: 5, correct: true }),
    ];
    expect(deriveBox(events, "phon:A")).toBe(3);
  });

  test("walks events in insertion order so clock skew is benign", () => {
    // recordLearningEvent always appends, so array order IS the canonical
    // chronological order even if Date.now() values are out of monotonic.
    const events = [ev({ ts: 200, correct: false }), ev({ ts: 100, correct: true })];
    // Walk: 0 → 1 (wrong, first in array) → 2 (correct promotes 1→2).
    expect(deriveBox(events, "phon:A")).toBe(2);
  });

  test("ignores events for unrelated atoms", () => {
    const events = [
      ev({ ts: 1, atomId: "phon:B", correct: false }),
      ev({ ts: 2, atomId: "phon:A", correct: true }),
    ];
    expect(deriveBox(events, "phon:A")).toBe(2);
  });
});

describe("deriveAllBoxes", () => {
  test("empty events produce empty map", () => {
    expect(deriveAllBoxes([])).toEqual(new Map());
  });

  test("returns one entry per touched atom; absent atoms missing", () => {
    const events = [
      ev({ ts: 1, atomId: "phon:A", correct: true }),
      ev({ ts: 2, atomId: "phon:B", correct: false }),
    ];
    const boxes = deriveAllBoxes(events);
    expect(boxes.get("phon:A")).toBe(2);
    expect(boxes.get("phon:B")).toBe(1);
    expect(boxes.has("phon:C")).toBe(false);
  });

  test("single pass produces same result as per-atom deriveBox", () => {
    const events: LearningEvent[] = [
      ev({ ts: 1, atomId: "phon:A", correct: true }),
      ev({ ts: 2, atomId: "phon:A", correct: true }),
      ev({ ts: 3, atomId: "phon:B", correct: false }),
      ev({ ts: 4, atomId: "phon:A", correct: true }),
      ev({ ts: 5, atomId: "phon:B", correct: true }),
    ];
    const boxes = deriveAllBoxes(events);
    expect(boxes.get("phon:A")).toBe(deriveBox(events, "phon:A"));
    expect(boxes.get("phon:B")).toBe(deriveBox(events, "phon:B"));
  });

  test("100 mixed events: each atom's final box matches per-atom probe", () => {
    const atoms = ["phon:A", "phon:B", "phon:C", "lstn:A", "num:position"];
    const events: LearningEvent[] = [];
    for (let i = 0; i < 100; i++) {
      const atomId = atoms[i % atoms.length]!;
      events.push(ev({ atomId, ts: i, correct: i % 3 !== 0 }));
    }
    const boxes = deriveAllBoxes(events);
    for (const atom of atoms) {
      expect(boxes.get(atom)).toBe(deriveBox(events, atom));
    }
  });
});

describe("boxFor", () => {
  test("returns the box when present", () => {
    const map = new Map<string, ReturnType<typeof deriveBox>>([["phon:A", 3]]);
    expect(boxFor(map, "phon:A")).toBe(3);
  });

  test("returns NEW_BOX for unknown atoms", () => {
    expect(boxFor(new Map(), "phon:Z")).toBe(NEW_BOX);
  });
});

describe("deriveMaxCorrectStreak", () => {
  test("empty events return 0", () => {
    expect(deriveMaxCorrectStreak([])).toBe(0);
  });

  test("counts the longest run of consecutive correct events", () => {
    const events: LearningEvent[] = [
      ev({ ts: 1, correct: true }),
      ev({ ts: 2, correct: true }),
      ev({ ts: 3, correct: false }),
      ev({ ts: 4, correct: true }),
      ev({ ts: 5, correct: true }),
      ev({ ts: 6, correct: true }),
      ev({ ts: 7, correct: false }),
    ];
    expect(deriveMaxCorrectStreak(events)).toBe(3);
  });

  test("a single wrong answer resets the run mid-streak", () => {
    const events: LearningEvent[] = [
      ...Array.from({ length: 5 }, (_, i) => ev({ ts: i + 1, correct: true })),
      ev({ ts: 99, correct: false }),
      ...Array.from({ length: 3 }, (_, i) => ev({ ts: 100 + i, correct: true })),
    ];
    expect(deriveMaxCorrectStreak(events)).toBe(5);
  });

  test("all wrong returns 0", () => {
    const events = Array.from({ length: 10 }, (_, i) => ev({ ts: i, correct: false }));
    expect(deriveMaxCorrectStreak(events)).toBe(0);
  });

  test("all correct returns the full count", () => {
    const events = Array.from({ length: 25 }, (_, i) => ev({ ts: i, correct: true }));
    expect(deriveMaxCorrectStreak(events)).toBe(25);
  });

  test("counts run across atoms (cross-mode streak)", () => {
    const events: LearningEvent[] = [
      ev({ ts: 1, atomId: "phon:A", correct: true }),
      ev({ ts: 2, atomId: "lstn:B", correct: true }),
      ev({ ts: 3, atomId: "num:position", mode: "number-pronunciation", correct: true }),
    ];
    expect(deriveMaxCorrectStreak(events)).toBe(3);
  });
});
