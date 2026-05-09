import { ABBREVIATIONS, type AbbreviationEntry } from "./abbreviations.ts";
import {
  shuffle,
  type AbbreviationDirection,
  type DrillChallenge,
  type DrillResult,
} from "./drill-types.ts";

const CHOICE_COUNT = 4;

function pickDirection(): AbbreviationDirection {
  return Math.random() < 0.5 ? "abbr-to-expansion" : "expansion-to-abbr";
}

function pickDistractors(correct: AbbreviationEntry, pool: readonly AbbreviationEntry[]): string[] {
  const candidates = pool.filter((e) => e.expansion !== correct.expansion);
  const shuffled = shuffle(candidates);
  const seen = new Set<string>([correct.expansion]);
  const out: string[] = [];
  for (const c of shuffled) {
    if (out.length >= CHOICE_COUNT - 1) break;
    if (seen.has(c.expansion)) continue;
    seen.add(c.expansion);
    out.push(c.expansion);
  }
  return out;
}

/**
 * Build a single abbreviation challenge with the direction chosen by the caller.
 * Public so the adaptive selection layer can force a specific direction
 * (e.g. when the queue has decided `abbr:DSC:expansion-to-abbr` is the weak
 * atom and that's the variant we want to surface).
 */
export function buildChallengeWithDirection(
  entry: AbbreviationEntry,
  direction: AbbreviationDirection,
  index: number,
): DrillChallenge {
  const id = `abbreviation-${index}-${entry.abbr}`;

  if (direction === "abbr-to-expansion") {
    const distractors = pickDistractors(entry, ABBREVIATIONS);
    const choices = shuffle([entry.expansion, ...distractors]);
    return {
      id,
      type: "abbreviation",
      direction,
      prompt: `What does '${entry.abbr}' stand for?`,
      expectedAnswer: entry.expansion,
      hint: entry.expansion,
      choices,
    };
  }

  return {
    id,
    type: "abbreviation",
    direction,
    prompt: `What is the abbreviation for '${entry.expansion}'?`,
    expectedAnswer: entry.abbr,
    hint: entry.abbr,
  };
}

export function generateAbbreviationChallenges(count: number): DrillChallenge[] {
  const pool = shuffle(ABBREVIATIONS);
  const take = Math.min(count, pool.length);
  return pool
    .slice(0, take)
    .map((entry, i) => buildChallengeWithDirection(entry, pickDirection(), i));
}

function normalize(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function getAbbreviation(challenge: DrillChallenge): string | null {
  if (challenge.type !== "abbreviation") return null;
  if (challenge.direction === "expansion-to-abbr") return challenge.expectedAnswer;
  const match = challenge.prompt.match(/'([^']+)'/);
  return match ? match[1]! : null;
}

export function scoreAbbreviation(challenge: DrillChallenge, studentAnswer: string): DrillResult {
  const expected = normalize(challenge.expectedAnswer);
  const submitted = normalize(studentAnswer);
  const correct = expected === submitted;
  return {
    challenge,
    studentAnswer,
    score: correct ? 100 : 0,
    matchedWords: correct ? [challenge.expectedAnswer] : [],
    missedWords: correct ? [] : [challenge.expectedAnswer],
  };
}
