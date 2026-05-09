import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { allocateQuotas, previewQueue, selectAdaptiveChallenges } from "./adaptive-selection.ts";
import type { LearningEvent } from "./learning-events.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function ev(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    v: 1,
    atomId: "phon:A",
    mode: "phonetic",
    correct: false,
    ts: 0,
    ...over,
  };
}

describe("allocateQuotas", () => {
  test("60/30/10 for count=10 with full buckets", () => {
    const buckets = {
      weak: Array(20)
        .fill(null)
        .map((_, i) => ({ atomId: `w${i}`, box: 1 as const })),
      review: Array(20)
        .fill(null)
        .map((_, i) => ({ atomId: `r${i}`, box: 3 as const })),
      fresh: Array(20)
        .fill(null)
        .map((_, i) => ({ atomId: `f${i}`, box: 0 as const })),
    };
    expect(allocateQuotas(buckets, 10)).toEqual({ weak: 6, review: 3, fresh: 1 });
  });

  test("redistributes when weak bucket is empty", () => {
    const buckets = {
      weak: [],
      review: Array(10)
        .fill(null)
        .map((_, i) => ({ atomId: `r${i}`, box: 3 as const })),
      fresh: Array(10)
        .fill(null)
        .map((_, i) => ({ atomId: `f${i}`, box: 0 as const })),
    };
    const out = allocateQuotas(buckets, 10);
    expect(out.weak).toBe(0);
    expect(out.review + out.fresh).toBe(10);
  });

  test("everything goes to fresh when only fresh has atoms", () => {
    const buckets = {
      weak: [],
      review: [],
      fresh: Array(36)
        .fill(null)
        .map((_, i) => ({ atomId: `f${i}`, box: 0 as const })),
    };
    expect(allocateQuotas(buckets, 5)).toEqual({ weak: 0, review: 0, fresh: 5 });
  });

  test("count larger than universe caps at universe size", () => {
    const buckets = {
      weak: [{ atomId: "w0", box: 1 as const }],
      review: [{ atomId: "r0", box: 3 as const }],
      fresh: [{ atomId: "f0", box: 0 as const }],
    };
    const out = allocateQuotas(buckets, 100);
    expect(out.weak + out.review + out.fresh).toBe(3);
  });

  test("count of 0 returns all zeros", () => {
    const buckets = { weak: [], review: [], fresh: [] };
    expect(allocateQuotas(buckets, 0)).toEqual({ weak: 0, review: 0, fresh: 0 });
  });
});

describe("previewQueue", () => {
  test("cold-start (no events) puts everything in fresh", () => {
    const preview = previewQueue("phonetic", 5, []);
    expect(preview).toEqual({ weak: 0, review: 0, fresh: 5 });
  });

  test("returns post-fallback targets when buckets are empty", () => {
    // Numbers has 4 atoms; ask for 10. Fresh holds all 4.
    const preview = previewQueue("number-pronunciation", 10, []);
    expect(preview.weak + preview.review + preview.fresh).toBe(4);
  });

  test("seeded weak atoms move to the weak bucket", () => {
    const events = [
      ev({ atomId: "phon:A", correct: false, ts: 1 }),
      ev({ atomId: "phon:B", correct: false, ts: 2 }),
      ev({ atomId: "phon:C", correct: false, ts: 3 }),
    ];
    const preview = previewQueue("phonetic", 10, events);
    expect(preview.weak).toBeGreaterThan(0);
  });
});

describe("selectAdaptiveChallenges — phonetic", () => {
  test("cold-start returns count phonetic challenges", () => {
    const challenges = selectAdaptiveChallenges("phonetic", 5, []);
    expect(challenges).toHaveLength(5);
    expect(challenges.every((c) => c.type === "phonetic")).toBe(true);
    expect(challenges.every((c) => c.expectedAnswer.length > 0)).toBe(true);
  });

  test("seeded weak letters appear far above uniform-random odds", () => {
    // Make A, B, C heavily wrong (5 wrongs each).
    const events: LearningEvent[] = [];
    let ts = 0;
    for (const L of ["A", "B", "C"]) {
      for (let i = 0; i < 5; i++) {
        events.push(ev({ atomId: `phon:${L}`, ts: ++ts, correct: false }));
      }
    }
    // Aggregate over multiple sessions to dampen Math.random variance —
    // the expected per-letter share for A/B/C is ~35% (weight 12 each
    // out of pool ~102), uniform-random would be 3/36 = 8.3%.
    let allLetters: string[] = [];
    for (let session = 0; session < 5; session++) {
      const challenges = selectAdaptiveChallenges("phonetic", 10, events);
      allLetters = allLetters.concat(challenges.flatMap((c) => c.expectedAnswer.split(" ")));
    }
    const weakLetters = allLetters.filter((w) => w === "ALFA" || w === "BRAVO" || w === "CHARLIE");
    expect(weakLetters.length / allLetters.length).toBeGreaterThan(0.22);
  });
});

describe("selectAdaptiveChallenges — number-pronunciation", () => {
  test("seeded weak num:position appears in the picks (universe of 4)", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      ev({ atomId: "num:position", mode: "number-pronunciation", ts: i, correct: false }),
    );
    const challenges = selectAdaptiveChallenges("number-pronunciation", 4, events);
    expect(challenges).toHaveLength(4);
    expect(challenges.some((c) => c.format === "position")).toBe(true);
  });

  test("count > universe is honored via with-replacement fill (e.g. 10 from a 4-atom universe)", () => {
    const challenges = selectAdaptiveChallenges("number-pronunciation", 10, []);
    expect(challenges).toHaveLength(10);
    expect(challenges.every((c) => c.type === "number-pronunciation")).toBe(true);
    // All 4 formats should be representable in the picks (high probability over 10 draws).
    const formats = new Set(challenges.map((c) => c.format));
    expect(formats.size).toBeGreaterThanOrEqual(2);
  });

  test("count of 20 still honored — fill pass loops until quota met", () => {
    const challenges = selectAdaptiveChallenges("number-pronunciation", 20, []);
    expect(challenges).toHaveLength(20);
  });
});

describe("selectAdaptiveChallenges — abbreviation", () => {
  test("returns challenges with the direction set per atom", () => {
    const events = [
      ev({
        atomId: "abbr:DSC:abbr-to-expansion",
        mode: "abbreviation",
        correct: false,
        ts: 1,
      }),
    ];
    const challenges = selectAdaptiveChallenges("abbreviation", 5, events);
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges.every((c) => c.type === "abbreviation")).toBe(true);
    expect(challenges.every((c) => c.direction !== undefined)).toBe(true);
    // Weak atom has direction "abbr-to-expansion" — it should appear in picks.
    const dirs = challenges.map((c) => c.direction);
    expect(dirs.some((d) => d === "abbr-to-expansion")).toBe(true);
  });

  test("forced direction matches the atom's direction half", () => {
    // Mock Math.random so weighted sampling deterministically picks the
    // single weak atom first inside its bucket.
    vi.spyOn(Math, "random").mockReturnValue(0); // first dart → first candidate
    const events = [
      ev({
        atomId: "abbr:RCC:expansion-to-abbr",
        mode: "abbreviation",
        correct: false,
        ts: 1,
      }),
    ];
    const challenges = selectAdaptiveChallenges("abbreviation", 1, events);
    expect(challenges).toHaveLength(1);
    expect(challenges[0]!.direction).toBe("expansion-to-abbr");
  });
});

describe("selectAdaptiveChallenges — listen", () => {
  test("returns reverse-mode challenges with spoken set", () => {
    const challenges = selectAdaptiveChallenges("reverse", 3, []);
    expect(challenges).toHaveLength(3);
    expect(challenges.every((c) => c.type === "reverse")).toBe(true);
    expect(challenges.every((c) => typeof c.spoken === "string" && c.spoken.length > 0)).toBe(true);
  });
});

describe("selectAdaptiveChallenges — procedures", () => {
  test("returns empty (procedures use scenario-level adaptive selection)", () => {
    expect(selectAdaptiveChallenges("procedures" as never, 5, [])).toEqual([]);
  });
});

describe("preview / select agreement", () => {
  test("number-pronunciation count of selection matches preview total", () => {
    const events = [
      ev({ atomId: "num:position", mode: "number-pronunciation", ts: 1, correct: false }),
      ev({ atomId: "num:bearing", mode: "number-pronunciation", ts: 2, correct: false }),
    ];
    const preview = previewQueue("number-pronunciation", 4, events);
    const challenges = selectAdaptiveChallenges("number-pronunciation", 4, events);
    expect(challenges).toHaveLength(preview.weak + preview.review + preview.fresh);
  });
});
