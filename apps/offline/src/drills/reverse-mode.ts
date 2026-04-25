import {
  PHONETIC_ALPHABET,
  randomCallsign,
  type DrillChallenge,
  type DrillResult,
} from "./drill-types.ts";

function spokenForm(text: string): string {
  return text
    .split("")
    .map((ch) => PHONETIC_ALPHABET[ch] ?? ch)
    .join(" ");
}

/**
 * Generate listen-then-type challenges. The user hears the phonetic spelling
 * via TTS and types the original alphanumeric back.
 */
export function generateReverseChallenges(count: number): DrillChallenge[] {
  const seen = new Set<string>();
  const challenges: DrillChallenge[] = [];

  for (let i = 0; i < count; i++) {
    let text: string;
    do {
      text = randomCallsign();
    } while (seen.has(text));
    seen.add(text);

    const spoken = spokenForm(text);
    challenges.push({
      id: `reverse-${i}`,
      type: "reverse",
      prompt: "Listen and type the letters/digits you hear.",
      expectedAnswer: text,
      hint: spoken,
      spoken,
    });
  }

  return challenges;
}

/** Score a reverse-mode answer. Case-insensitive exact match against the alphanumeric. */
export function scoreReverse(challenge: DrillChallenge, studentAnswer: string): DrillResult {
  const expected = challenge.expectedAnswer.toUpperCase();
  const submitted = studentAnswer.toUpperCase().replace(/\s+/g, "");

  const expectedChars = expected.split("");
  const submittedChars = submitted.split("");

  const matched: string[] = [];
  const missed: string[] = [];

  for (let i = 0; i < expectedChars.length; i++) {
    if (submittedChars[i] === expectedChars[i]) {
      matched.push(expectedChars[i]!);
    } else {
      missed.push(expectedChars[i]!);
    }
  }

  const extraChars = Math.max(0, submittedChars.length - expectedChars.length);
  const denominator = expectedChars.length + extraChars;
  const score = denominator > 0 ? Math.round((matched.length / denominator) * 100) : 100;

  return { challenge, studentAnswer, score, matchedWords: matched, missedWords: missed };
}
