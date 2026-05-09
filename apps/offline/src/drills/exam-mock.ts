/** Interleaved exam across the count-driven modes; strict scoring (only 100% counts). */

import { generateAbbreviationChallenges } from "./abbreviation-mode.ts";
import { selectAdaptiveChallenges } from "./adaptive-selection.ts";
import { generateChannelChallenges } from "./channel-mode.ts";
import {
  generateNumberChallenges,
  generatePhoneticChallenges,
  shuffle,
  type DrillChallenge,
  type DrillResult,
  type DrillType,
} from "./drill-types.ts";
import type { LearningEvent } from "./learning-events.ts";
import { generateReverseChallenges } from "./reverse-mode.ts";

export const EXAM_MOCK_PER_MODE = 5;
export const EXAM_MOCK_PASS_PCT = 80;

export const EXAM_MOCK_MODES: readonly DrillType[] = [
  "phonetic",
  "number-pronunciation",
  "reverse",
  "abbreviation",
  "channel",
];

export const EXAM_MOCK_TOTAL = EXAM_MOCK_MODES.length * EXAM_MOCK_PER_MODE;

export interface ExamModeBreakdown {
  readonly mode: DrillType;
  readonly correct: number;
  readonly total: number;
}

export interface ExamMockSummary {
  readonly perMode: readonly ExamModeBreakdown[];
  readonly correct: number;
  readonly total: number;
  readonly pct: number;
  readonly passed: boolean;
}

function generateFor(mode: DrillType, count: number): DrillChallenge[] {
  switch (mode) {
    case "phonetic":
      return generatePhoneticChallenges(count);
    case "reverse":
      return generateReverseChallenges(count);
    case "number-pronunciation":
      return generateNumberChallenges(count);
    case "abbreviation":
      return generateAbbreviationChallenges(count);
    case "channel":
      return generateChannelChallenges(count);
  }
}

export function selectExamMockChallenges(events: readonly LearningEvent[]): DrillChallenge[] {
  const merged: DrillChallenge[] = [];
  for (const mode of EXAM_MOCK_MODES) {
    let bucket = selectAdaptiveChallenges(mode, EXAM_MOCK_PER_MODE, events);
    if (bucket.length < EXAM_MOCK_PER_MODE) {
      bucket = generateFor(mode, EXAM_MOCK_PER_MODE);
    }
    merged.push(...bucket);
  }
  return shuffle(merged);
}

export function summarizeExamMock(results: readonly DrillResult[]): ExamMockSummary {
  const perMode: ExamModeBreakdown[] = EXAM_MOCK_MODES.map((mode) => {
    const matching = results.filter((r) => r.challenge.type === mode);
    const correct = matching.filter((r) => r.score === 100).length;
    return { mode, correct, total: matching.length };
  });
  const total = results.length;
  const correct = results.filter((r) => r.score === 100).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { perMode, correct, total, pct, passed: pct >= EXAM_MOCK_PASS_PCT };
}
