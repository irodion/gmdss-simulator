import { describe, expect, test } from "vite-plus/test";
import type { DrillChallenge, DrillResult, DrillType } from "./drill-types.ts";
import {
  EXAM_MOCK_MODES,
  EXAM_MOCK_PASS_PCT,
  EXAM_MOCK_PER_MODE,
  EXAM_MOCK_TOTAL,
  selectExamMockChallenges,
  summarizeExamMock,
  type ExamModeBreakdown,
} from "./exam-mock.ts";

function fakeResult(mode: DrillType, score: number): DrillResult {
  const challenge: DrillChallenge = {
    id: `${mode}-test`,
    type: mode,
    prompt: "test",
    expectedAnswer: "X",
  };
  return { challenge, studentAnswer: "x", score, matchedWords: [], missedWords: [] };
}

describe("constants", () => {
  test("EXAM_MOCK_TOTAL = EXAM_MOCK_PER_MODE × EXAM_MOCK_MODES.length", () => {
    expect(EXAM_MOCK_TOTAL).toBe(EXAM_MOCK_PER_MODE * EXAM_MOCK_MODES.length);
  });

  test("4 count-driven modes (excludes procedures)", () => {
    expect(EXAM_MOCK_MODES).toHaveLength(4);
    expect(EXAM_MOCK_MODES).not.toContain("procedures");
  });
});

describe("selectExamMockChallenges", () => {
  test("cold-start returns 20 challenges", () => {
    const challenges = selectExamMockChallenges([]);
    expect(challenges).toHaveLength(EXAM_MOCK_TOTAL);
  });

  test("each mode is represented exactly 5 times", () => {
    const challenges = selectExamMockChallenges([]);
    const counts: Record<DrillType, number> = {
      phonetic: 0,
      "number-pronunciation": 0,
      reverse: 0,
      abbreviation: 0,
    };
    for (const c of challenges) {
      counts[c.type] += 1;
    }
    for (const mode of EXAM_MOCK_MODES) {
      expect(counts[mode]).toBe(EXAM_MOCK_PER_MODE);
    }
  });

  test("challenge ids are unique across buckets", () => {
    // Per-mode generators independently number from 0; if any two buckets
    // shipped equal ids, this set would shrink under merge.
    const challenges = selectExamMockChallenges([]);
    const ids = new Set(challenges.map((c) => c.id));
    expect(ids.size).toBe(challenges.length);
  });
});

describe("summarizeExamMock", () => {
  function buildResults(spec: Record<DrillType, number[]>): DrillResult[] {
    const out: DrillResult[] = [];
    for (const mode of EXAM_MOCK_MODES) {
      for (const score of spec[mode]) out.push(fakeResult(mode, score));
    }
    return out;
  }

  test("16 of 20 perfect → 80% / passed", () => {
    const results = buildResults({
      phonetic: [100, 100, 100, 100, 99],
      "number-pronunciation": [100, 100, 100, 0, 50],
      reverse: [100, 100, 100, 100, 100],
      abbreviation: [100, 100, 100, 100, 0],
    });
    const summary = summarizeExamMock(results);
    expect(summary.correct).toBe(16);
    expect(summary.total).toBe(20);
    expect(summary.pct).toBe(80);
    expect(summary.passed).toBe(true);
  });

  test("15 of 20 perfect → 75% / failed (just below threshold)", () => {
    const results = buildResults({
      phonetic: [100, 100, 100, 100, 0],
      "number-pronunciation": [100, 100, 100, 0, 0],
      reverse: [100, 100, 100, 100, 0],
      abbreviation: [100, 100, 100, 100, 0],
    });
    const summary = summarizeExamMock(results);
    expect(summary.correct).toBe(15);
    expect(summary.pct).toBe(75);
    expect(summary.passed).toBe(false);
  });

  test("partial scores (99) count as wrong on the exam", () => {
    const results = [fakeResult("phonetic", 99), fakeResult("phonetic", 100)];
    const summary = summarizeExamMock(results);
    expect(summary.correct).toBe(1);
  });

  test("per-mode breakdown matches input distribution", () => {
    const results = buildResults({
      phonetic: [100, 100, 100, 100, 100],
      "number-pronunciation": [100, 100, 100, 0, 0],
      reverse: [100, 100, 0, 0, 0],
      abbreviation: [100, 0, 0, 0, 0],
    });
    const summary = summarizeExamMock(results);
    const byMode = new Map<DrillType, ExamModeBreakdown>();
    for (const row of summary.perMode) byMode.set(row.mode, row);
    expect(byMode.get("phonetic")).toEqual({ mode: "phonetic", correct: 5, total: 5 });
    expect(byMode.get("number-pronunciation")).toEqual({
      mode: "number-pronunciation",
      correct: 3,
      total: 5,
    });
    expect(byMode.get("reverse")).toEqual({ mode: "reverse", correct: 2, total: 5 });
    expect(byMode.get("abbreviation")).toEqual({ mode: "abbreviation", correct: 1, total: 5 });
  });

  test("empty results return zeros and 0%", () => {
    const summary = summarizeExamMock([]);
    expect(summary).toMatchObject({ correct: 0, total: 0, pct: 0, passed: false });
  });

  test("PASS threshold pinned at 80", () => {
    expect(EXAM_MOCK_PASS_PCT).toBe(80);
  });
});
