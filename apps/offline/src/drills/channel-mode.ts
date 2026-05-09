import { CHANNELS, type ChannelEntry } from "./channels.ts";
import {
  randomInt,
  shuffle,
  type ChannelDirection,
  type DrillChallenge,
  type DrillResult,
} from "./drill-types.ts";

const CHOICE_COUNT = 4;

function pickDistractors(
  correct: ChannelEntry,
  field: "usage" | "channel",
  pool: readonly ChannelEntry[],
): string[] {
  const correctValue = correct[field];
  const candidates = pool.filter((e) => e[field] !== correctValue);
  const shuffled = shuffle(candidates);
  const seen = new Set<string>([correctValue]);
  const out: string[] = [];
  for (const c of shuffled) {
    if (out.length >= CHOICE_COUNT - 1) break;
    if (seen.has(c[field])) continue;
    seen.add(c[field]);
    out.push(c[field]);
  }
  return out;
}

/** Build a single channel challenge with a caller-specified direction (used by adaptive selection). */
export function buildChannelChallengeWithDirection(
  entry: ChannelEntry,
  direction: ChannelDirection,
  index: number,
): DrillChallenge {
  const id = `channel-${index}-${entry.channel}-${direction}`;

  if (direction === "channel-to-usage") {
    const distractors = pickDistractors(entry, "usage", CHANNELS);
    const choices = shuffle([entry.usage, ...distractors]);
    return {
      id,
      type: "channel",
      channelDirection: direction,
      channelId: entry.channel,
      prompt: `What is the primary use of Channel ${entry.channel}?`,
      expectedAnswer: entry.usage,
      hint: entry.usage,
      choices,
    };
  }

  const distractors = pickDistractors(entry, "channel", CHANNELS);
  const choices = shuffle([entry.channel, ...distractors]).map((c) => `Channel ${c}`);
  return {
    id,
    type: "channel",
    channelDirection: direction,
    channelId: entry.channel,
    prompt: `Which channel is used for ${entry.description}?`,
    expectedAnswer: `Channel ${entry.channel}`,
    hint: `Channel ${entry.channel}`,
    choices,
  };
}

/**
 * Build a directions array of length `count` with both directions roughly evenly
 * represented, then shuffled. For count >= 2 this guarantees the help-text promise
 * "each session mixes both directions" — random per-question coin flips don't.
 */
function buildDirectionMix(count: number): ChannelDirection[] {
  if (count <= 0) return [];
  const ctuCount = Math.random() < 0.5 ? Math.ceil(count / 2) : Math.floor(count / 2);
  const out: ChannelDirection[] = [];
  for (let i = 0; i < ctuCount; i++) out.push("channel-to-usage");
  while (out.length < count) out.push("usage-to-channel");
  return shuffle(out);
}

export function generateChannelChallenges(count: number): DrillChallenge[] {
  if (count <= 0) return [];
  const seeded: ChannelEntry[] = shuffle(CHANNELS).slice(0, count);
  // Fill pass: when count exceeds the 9-channel pool, repeat random entries so
  // a 20-question Free Practice session actually delivers 20 challenges.
  while (seeded.length < count) {
    seeded.push(CHANNELS[randomInt(CHANNELS.length)]!);
  }
  // Final shuffle so repeats from the fill pass aren't clustered at the tail.
  const entries = shuffle(seeded);
  const directions = buildDirectionMix(count);
  return entries.map((entry, i) => buildChannelChallengeWithDirection(entry, directions[i]!, i));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scoreChannel(challenge: DrillChallenge, studentAnswer: string): DrillResult {
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
