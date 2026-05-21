import { describe, expect, test } from "vite-plus/test";
import { THEORY_QUESTIONS, THEORY_TOPICS, type TheoryTopic } from "./theory.ts";

describe("THEORY_QUESTIONS data integrity", () => {
  test("every question id is unique", () => {
    const ids = new Set(THEORY_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(THEORY_QUESTIONS.length);
  });

  test("every question carries a known topic", () => {
    const topics = new Set<string>(THEORY_TOPICS);
    for (const q of THEORY_QUESTIONS) {
      expect(topics.has(q.topic)).toBe(true);
    }
  });

  test("every question has a non-empty prompt, correct answer, and three distractors", () => {
    for (const q of THEORY_QUESTIONS) {
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.correctAnswer.trim().length).toBeGreaterThan(0);
      expect(q.distractors).toHaveLength(3);
      for (const d of q.distractors) {
        expect(d.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("the four options of every question are all distinct (correct answer not duplicated)", () => {
    for (const q of THEORY_QUESTIONS) {
      const options = [q.correctAnswer, ...q.distractors];
      expect(new Set(options).size).toBe(4);
    }
  });

  test("all six topics are represented, each with at least two questions", () => {
    const counts = new Map<TheoryTopic, number>();
    for (const q of THEORY_QUESTIONS) {
      counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    }
    for (const topic of THEORY_TOPICS) {
      expect(counts.get(topic) ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  test("the bank can satisfy the largest session length the picker offers", () => {
    // SessionConfig offers sessions of up to 20 questions; the bank must honour that.
    expect(THEORY_QUESTIONS.length).toBeGreaterThanOrEqual(20);
  });
});
