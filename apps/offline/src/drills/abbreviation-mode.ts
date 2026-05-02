import { ABBREVIATIONS, type AbbreviationEntry } from "./abbreviations.ts";
import {
  randomInt,
  type AbbreviationDirection,
  type DrillChallenge,
  type DrillResult,
} from "./drill-types.ts";

const CHOICE_COUNT = 4;

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

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

function buildChallenge(entry: AbbreviationEntry, index: number): DrillChallenge {
  const direction = pickDirection();
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
  return pool.slice(0, take).map((entry, i) => buildChallenge(entry, i));
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
