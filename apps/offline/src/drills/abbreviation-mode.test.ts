import { describe, expect, test } from "vite-plus/test";
import { generateAbbreviationChallenges, scoreAbbreviation } from "./abbreviation-mode.ts";
import { ABBREVIATIONS } from "./abbreviations.ts";
import type { DrillChallenge } from "./drill-types.ts";

function findChallenge(
  challenges: readonly DrillChallenge[],
  predicate: (c: DrillChallenge) => boolean,
): DrillChallenge | undefined {
  return challenges.find(predicate);
}

describe("generateAbbreviationChallenges", () => {
  test("returns the requested number of challenges (when pool is large enough)", () => {
    const out = generateAbbreviationChallenges(5);
    expect(out).toHaveLength(5);
  });

  test("returns distinct entries (no duplicates within a session)", () => {
    const out = generateAbbreviationChallenges(10);
    const ids = new Set(out.map((c) => c.id));
    expect(ids.size).toBe(out.length);
  });

  test("caps at the pool size when count > pool", () => {
    const out = generateAbbreviationChallenges(ABBREVIATIONS.length + 50);
    expect(out.length).toBe(ABBREVIATIONS.length);
  });

  test("MC variant has exactly 4 unique choices including the correct expansion", () => {
    // Run many sessions to virtually guarantee at least one abbr-to-expansion challenge.
    let mcSeen = 0;
    for (let i = 0; i < 30 && mcSeen < 5; i++) {
      const out = generateAbbreviationChallenges(20);
      for (const c of out) {
        if (c.direction === "abbr-to-expansion") {
          mcSeen++;
          expect(c.choices).toBeDefined();
          expect(c.choices!.length).toBe(4);
          expect(new Set(c.choices).size).toBe(4);
          expect(c.choices).toContain(c.expectedAnswer);
        }
      }
    }
    expect(mcSeen).toBeGreaterThan(0);
  });

  test("free-text variant has no choices and expectedAnswer is the abbreviation", () => {
    let textSeen = 0;
    for (let i = 0; i < 30 && textSeen < 5; i++) {
      const out = generateAbbreviationChallenges(20);
      for (const c of out) {
        if (c.direction === "expansion-to-abbr") {
          textSeen++;
          expect(c.choices).toBeUndefined();
          // expectedAnswer should match an entry's abbr exactly.
          expect(ABBREVIATIONS.some((e) => e.abbr === c.expectedAnswer)).toBe(true);
        }
      }
    }
    expect(textSeen).toBeGreaterThan(0);
  });

  test("both directions appear over a large run", () => {
    const big = generateAbbreviationChallenges(ABBREVIATIONS.length);
    const directions = new Set(big.map((c) => c.direction));
    expect(directions.has("abbr-to-expansion")).toBe(true);
    expect(directions.has("expansion-to-abbr")).toBe(true);
  });

  test("every challenge carries type 'abbreviation'", () => {
    const out = generateAbbreviationChallenges(8);
    for (const c of out) {
      expect(c.type).toBe("abbreviation");
    }
  });
});

describe("scoreAbbreviation", () => {
  function freeTextChallenge(abbr: string): DrillChallenge {
    return {
      id: "t",
      type: "abbreviation",
      direction: "expansion-to-abbr",
      prompt: `What is the abbreviation for 'something'?`,
      expectedAnswer: abbr,
    };
  }

  function mcChallenge(expansion: string): DrillChallenge {
    return {
      id: "m",
      type: "abbreviation",
      direction: "abbr-to-expansion",
      prompt: `What does 'X' stand for?`,
      expectedAnswer: expansion,
      choices: [expansion, "Wrong A", "Wrong B", "Wrong C"],
    };
  }

  test("scores exact match as 100 (free text)", () => {
    const c = freeTextChallenge("MRCC");
    expect(scoreAbbreviation(c, "MRCC").score).toBe(100);
  });

  test("scoring is case-insensitive (free text)", () => {
    const c = freeTextChallenge("MRCC");
    expect(scoreAbbreviation(c, "mrcc").score).toBe(100);
    expect(scoreAbbreviation(c, "MrCc").score).toBe(100);
  });

  test("scoring trims surrounding whitespace (free text)", () => {
    const c = freeTextChallenge("MRCC");
    expect(scoreAbbreviation(c, "  MRCC  ").score).toBe(100);
    expect(scoreAbbreviation(c, "\tMRCC\n").score).toBe(100);
  });

  test("rejects wrong family member with score 0 (free text)", () => {
    const c = freeTextChallenge("MRCC");
    expect(scoreAbbreviation(c, "MRSC").score).toBe(0);
    expect(scoreAbbreviation(c, "JRCC").score).toBe(0);
  });

  test("internal whitespace is collapsed (free text)", () => {
    const c = freeTextChallenge("Tango Romeo");
    expect(scoreAbbreviation(c, "tango  romeo").score).toBe(100);
  });

  test("scores correct MC pick as 100", () => {
    const c = mcChallenge("Maritime Rescue Coordination Centre");
    expect(scoreAbbreviation(c, "Maritime Rescue Coordination Centre").score).toBe(100);
  });

  test("scores wrong MC pick as 0", () => {
    const c = mcChallenge("Maritime Rescue Coordination Centre");
    expect(scoreAbbreviation(c, "Wrong A").score).toBe(0);
  });

  test("DrillResult missedWords is empty on correct, populated on wrong", () => {
    const c = freeTextChallenge("MRCC");
    expect(scoreAbbreviation(c, "MRCC").missedWords).toEqual([]);
    expect(scoreAbbreviation(c, "MRSC").missedWords).toEqual(["MRCC"]);
  });
});

describe("scoreAbbreviation interplay with generated challenges", () => {
  test("a generated MC challenge scores its expectedAnswer as correct", () => {
    let tested = 0;
    for (let i = 0; i < 20 && tested === 0; i++) {
      const out = generateAbbreviationChallenges(10);
      const mc = findChallenge(out, (c) => c.direction === "abbr-to-expansion");
      if (mc) {
        expect(scoreAbbreviation(mc, mc.expectedAnswer).score).toBe(100);
        tested++;
      }
    }
    expect(tested).toBe(1);
  });
});
