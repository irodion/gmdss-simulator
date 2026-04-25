import { describe, expect, test } from "vite-plus/test";
import { generateReverseChallenges, scoreReverse } from "./reverse-mode.ts";

describe("generateReverseChallenges", () => {
  test("returns the requested count", () => {
    expect(generateReverseChallenges(5)).toHaveLength(5);
  });

  test("each challenge carries spoken phonetics and an alphanumeric expected", () => {
    const challenges = generateReverseChallenges(10);
    for (const c of challenges) {
      expect(c.type).toBe("reverse");
      expect(c.spoken).toBeTruthy();
      expect(c.expectedAnswer).toMatch(/^[A-Z0-9]+$/);
      // Spoken should contain at least one space (multiple words)
      expect(c.spoken!.split(" ").length).toBeGreaterThan(1);
    }
  });

  test("produces unique callsigns", () => {
    const challenges = generateReverseChallenges(15);
    const set = new Set(challenges.map((c) => c.expectedAnswer));
    expect(set.size).toBe(15);
  });
});

describe("scoreReverse", () => {
  const c = {
    id: "r-1",
    type: "reverse" as const,
    prompt: "Listen and type",
    expectedAnswer: "AB12",
    spoken: "ALFA BRAVO WUN TOO",
  };

  test("scores an exact match at 100", () => {
    expect(scoreReverse(c, "AB12").score).toBe(100);
  });

  test("is case-insensitive", () => {
    expect(scoreReverse(c, "ab12").score).toBe(100);
  });

  test("ignores whitespace", () => {
    expect(scoreReverse(c, "A B 1 2").score).toBe(100);
  });

  test("partial answers get partial credit", () => {
    expect(scoreReverse(c, "AB13").score).toBe(75);
  });

  test("an empty answer scores 0", () => {
    expect(scoreReverse(c, "").score).toBe(0);
  });

  test("extra trailing characters reduce the score", () => {
    // 4 matched chars over 4 expected + 2 extra = 4/6 = 67
    expect(scoreReverse(c, "AB12ZZ").score).toBe(67);
  });
});
