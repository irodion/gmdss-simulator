/** Theory Mode — question selection and binary scoring. No adaptive footprint. */

import { shuffle } from "./drill-types.ts";
import {
  THEORY_QUESTIONS,
  THEORY_TOPICS,
  type TheoryQuestion,
  type TheoryTopic,
} from "./theory.ts";

/** A scored answer to one Theory question. */
export interface TheoryResult {
  readonly question: TheoryQuestion;
  /** The four options as shown to the student (correct answer + 3 distractors, shuffled). */
  readonly options: readonly string[];
  readonly studentAnswer: string;
  readonly correct: boolean;
}

/** Build the four shuffled options for a question — its correct answer plus its three distractors. */
export function buildTheoryOptions(question: TheoryQuestion): string[] {
  return shuffle([question.correctAnswer, ...question.distractors]);
}

/**
 * Select `count` questions, balanced across the six topics.
 *
 * Groups the bank by topic, then round-robins across the shuffled topic
 * buckets so a short session still spans several topics. Unlike the Drill
 * Modes (e.g. `generateChannelChallenges`' fill pass), a knowledge quiz never
 * repeats a question — when `count` exceeds the bank size the result is simply
 * capped at the bank size.
 */
export function selectTheoryQuestions(count: number): TheoryQuestion[] {
  if (count <= 0) return [];

  const byTopic = new Map<TheoryTopic, TheoryQuestion[]>();
  for (const topic of THEORY_TOPICS) byTopic.set(topic, []);
  for (const q of shuffle(THEORY_QUESTIONS)) {
    byTopic.get(q.topic)?.push(q);
  }

  const buckets = shuffle([...byTopic.values()].filter((b) => b.length > 0));
  const picked: TheoryQuestion[] = [];
  let drained = false;
  while (picked.length < count && !drained) {
    drained = true;
    for (const bucket of buckets) {
      if (picked.length >= count) break;
      const next = bucket.pop();
      if (next) {
        picked.push(next);
        drained = false;
      }
    }
  }
  return shuffle(picked);
}

/** Score one answer. Theory scoring is binary — the answer matches the correct option or it does not. */
export function scoreTheory(
  question: TheoryQuestion,
  options: readonly string[],
  studentAnswer: string,
): TheoryResult {
  return {
    question,
    options,
    studentAnswer,
    correct: studentAnswer === question.correctAnswer,
  };
}
