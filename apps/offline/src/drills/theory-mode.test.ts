import { describe, expect, test } from "vite-plus/test";
import { buildTheoryOptions, scoreTheory, selectTheoryQuestions } from "./theory-mode.ts";
import { THEORY_QUESTIONS, type TheoryQuestion } from "./theory.ts";

const FIRST = THEORY_QUESTIONS[0]!;

describe("buildTheoryOptions", () => {
  test("returns four distinct options including the correct answer", () => {
    const options = buildTheoryOptions(FIRST);
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain(FIRST.correctAnswer);
    for (const d of FIRST.distractors) {
      expect(options).toContain(d);
    }
  });

  test("the correct answer does not always land in the same position", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 40; i++) {
      positions.add(buildTheoryOptions(FIRST).indexOf(FIRST.correctAnswer));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("selectTheoryQuestions", () => {
  test("count of 0 or negative returns no questions", () => {
    expect(selectTheoryQuestions(0)).toEqual([]);
    expect(selectTheoryQuestions(-4)).toEqual([]);
  });

  test("returns the requested number of questions for every session length the picker offers", () => {
    for (const count of [5, 10, 20]) {
      expect(selectTheoryQuestions(count)).toHaveLength(count);
    }
  });

  test("caps at the bank size when count exceeds it — never repeats a question", () => {
    const out = selectTheoryQuestions(THEORY_QUESTIONS.length + 50);
    expect(out).toHaveLength(THEORY_QUESTIONS.length);
    expect(new Set(out.map((q) => q.id)).size).toBe(out.length);
  });

  test("never returns a duplicate question within one session", () => {
    for (let trial = 0; trial < 30; trial++) {
      for (const count of [5, 10, 20]) {
        const out = selectTheoryQuestions(count);
        expect(new Set(out.map((q) => q.id)).size).toBe(out.length);
      }
    }
  });

  test("a short session is spread across several topics, not clustered in one", () => {
    for (let trial = 0; trial < 30; trial++) {
      const topics = new Set(selectTheoryQuestions(5).map((q) => q.topic));
      expect(topics.size).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("scoreTheory", () => {
  function question(over: Partial<TheoryQuestion> = {}): TheoryQuestion {
    return {
      id: "t",
      topic: "VHF",
      prompt: "Test prompt?",
      correctAnswer: "Right",
      distractors: ["Wrong A", "Wrong B", "Wrong C"],
      ...over,
    };
  }

  test("marks an answer matching the correct option as correct", () => {
    const q = question();
    const r = scoreTheory(q, ["Right", "Wrong A", "Wrong B", "Wrong C"], "Right");
    expect(r.correct).toBe(true);
    expect(r.question).toBe(q);
    expect(r.studentAnswer).toBe("Right");
  });

  test("marks a non-matching answer as incorrect", () => {
    const r = scoreTheory(question(), ["Right", "Wrong A", "Wrong B", "Wrong C"], "Wrong A");
    expect(r.correct).toBe(false);
  });
});

describe("interplay between selection and scoring", () => {
  test("every selected question scores correct against its own correct answer", () => {
    const selected = selectTheoryQuestions(THEORY_QUESTIONS.length);
    for (const q of selected) {
      const options = buildTheoryOptions(q);
      expect(scoreTheory(q, options, q.correctAnswer).correct).toBe(true);
    }
  });
});
