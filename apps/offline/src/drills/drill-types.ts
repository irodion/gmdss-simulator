export type DrillType = "phonetic" | "number-pronunciation" | "reverse";

export interface DrillChallenge {
  readonly id: string;
  readonly type: DrillType;
  readonly prompt: string;
  readonly expectedAnswer: string;
  readonly hint?: string;
  /**
   * For reverse-mode challenges: the spoken phonetic words fed to TTS.
   * Unused for other types.
   */
  readonly spoken?: string;
}

export interface DrillResult {
  readonly challenge: DrillChallenge;
  readonly studentAnswer: string;
  readonly score: number;
  readonly matchedWords: readonly string[];
  readonly missedWords: readonly string[];
}

/** NATO phonetic alphabet mapping (with maritime number forms). */
export const PHONETIC_ALPHABET: Record<string, string> = {
  A: "ALFA",
  B: "BRAVO",
  C: "CHARLIE",
  D: "DELTA",
  E: "ECHO",
  F: "FOXTROT",
  G: "GOLF",
  H: "HOTEL",
  I: "INDIA",
  J: "JULIET",
  K: "KILO",
  L: "LIMA",
  M: "MIKE",
  N: "NOVEMBER",
  O: "OSCAR",
  P: "PAPA",
  Q: "QUEBEC",
  R: "ROMEO",
  S: "SIERRA",
  T: "TANGO",
  U: "UNIFORM",
  V: "VICTOR",
  W: "WHISKEY",
  X: "XRAY",
  Y: "YANKEE",
  Z: "ZULU",
  "0": "ZERO",
  "1": "WUN",
  "2": "TOO",
  "3": "TREE",
  "4": "FOW-ER",
  "5": "FIFE",
  "6": "SIX",
  "7": "SEV-EN",
  "8": "AIT",
  "9": "NIN-ER",
};

/** Convert a digit string to maritime pronunciation using PHONETIC_ALPHABET. */
export function pronounceDigits(digits: string): string {
  return digits
    .split("")
    .map((d) => PHONETIC_ALPHABET[d] ?? d)
    .join(" ");
}

/** Generate a phonetic drill challenge from a callsign or text. */
export function createPhoneticChallenge(text: string, id: string): DrillChallenge {
  const expected = text
    .toUpperCase()
    .split("")
    .filter((ch) => PHONETIC_ALPHABET[ch] != null || /[A-Z0-9]/.test(ch))
    .map((ch) => PHONETIC_ALPHABET[ch] ?? ch)
    .join(" ");
  return {
    id,
    type: "phonetic",
    prompt: `Spell: ${text.toUpperCase()}`,
    expectedAnswer: expected,
    hint: `Use the NATO phonetic alphabet: ${expected}`,
  };
}

const CALLSIGN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const VESSEL_ADJECTIVES = [
  "RED",
  "BLUE",
  "STAR",
  "IRON",
  "WILD",
  "GREY",
  "GOLD",
  "DARK",
  "SWIFT",
  "BOLD",
  "PROUD",
  "CALM",
  "NORTH",
  "SOUTH",
] as const;

const VESSEL_NOUNS = [
  "HAWK",
  "WIND",
  "WAVE",
  "DUCK",
  "STAR",
  "REEF",
  "GULL",
  "TIDE",
  "CREST",
  "SAIL",
  "HELM",
  "ANCHOR",
  "PEARL",
  "CORAL",
] as const;

export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function randomCallsign(): string {
  const len = 4 + randomInt(3);
  let result = "";
  for (let i = 0; i < len; i++) {
    result += CALLSIGN_CHARS[randomInt(CALLSIGN_CHARS.length)]!;
  }
  return result;
}

function randomVesselName(): string {
  const adj = VESSEL_ADJECTIVES[randomInt(VESSEL_ADJECTIVES.length)]!;
  const noun = VESSEL_NOUNS[randomInt(VESSEL_NOUNS.length)]!;
  return `${adj} ${noun}`;
}

/** Generate a set of unique phonetic drill challenges. */
export function generatePhoneticChallenges(count: number): DrillChallenge[] {
  const seen = new Set<string>();
  const challenges: DrillChallenge[] = [];

  for (let i = 0; i < count; i++) {
    const useVessel = i >= Math.ceil(count / 2);
    let text: string;
    let attempts = 0;
    do {
      text = useVessel && attempts < 30 ? randomVesselName() : randomCallsign();
      attempts++;
    } while (seen.has(text));
    seen.add(text);
    challenges.push(createPhoneticChallenge(text, `phonetic-${i}`));
  }

  return challenges;
}

const VHF_CHANNELS = [6, 8, 10, 12, 13, 14, 16, 67, 68, 69, 70, 71, 72, 73, 77] as const;

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function randomPosition(): { prompt: string; expected: string } {
  const latDeg = randomInt(90);
  const latMin = randomInt(60);
  const lonDeg = randomInt(180);
  const lonMin = randomInt(60);
  const ns = Math.random() < 0.5 ? "N" : "S";
  const ew = Math.random() < 0.5 ? "E" : "W";
  const nsWord = ns === "N" ? "NORTH" : "SOUTH";
  const ewWord = ew === "E" ? "EAST" : "WEST";

  const prompt = `${pad(latDeg, 2)}°${pad(latMin, 2)}'${ns} ${pad(lonDeg, 3)}°${pad(lonMin, 2)}'${ew}`;
  const expected =
    `${pronounceDigits(pad(latDeg, 2))} DEGREES ${pronounceDigits(pad(latMin, 2))} MINUTES ${nsWord} ` +
    `${pronounceDigits(pad(lonDeg, 3))} DEGREES ${pronounceDigits(pad(lonMin, 2))} MINUTES ${ewWord}`;

  return { prompt, expected };
}

function randomBearing(): { prompt: string; expected: string } {
  const deg = randomInt(360);
  const prompt = `Bearing: ${pad(deg, 3)}°`;
  const expected = `${pronounceDigits(pad(deg, 3))} DEGREES`;
  return { prompt, expected };
}

function randomTime(): { prompt: string; expected: string } {
  const h = randomInt(24);
  const m = randomInt(60);
  const hhmm = `${pad(h, 2)}${pad(m, 2)}`;
  const prompt = `Time: ${hhmm} UTC`;
  const expected = `${pronounceDigits(hhmm)} UTC`;
  return { prompt, expected };
}

function randomChannel(): { prompt: string; expected: string } {
  const ch = VHF_CHANNELS[randomInt(VHF_CHANNELS.length)]!;
  const prompt = `Channel ${ch}`;
  const expected = `CHANNEL ${pronounceDigits(String(ch))}`;
  return { prompt, expected };
}

type NumberGenerator = () => { prompt: string; expected: string };

/** Generate a set of number pronunciation drill challenges. */
export function generateNumberChallenges(count: number): DrillChallenge[] {
  const base: NumberGenerator[] = [
    randomPosition,
    randomPosition,
    randomBearing,
    randomTime,
    randomChannel,
  ];
  const extras: NumberGenerator[] = [randomPosition, randomBearing, randomTime, randomChannel];

  const generators = base.slice(0, count);
  while (generators.length < count) {
    generators.push(extras[randomInt(extras.length)]!);
  }

  for (let i = generators.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [generators[i], generators[j]] = [generators[j]!, generators[i]!];
  }

  return generators.map((gen, i) => {
    const data = gen();
    return {
      id: `number-${i}`,
      type: "number-pronunciation",
      prompt: `Read using maritime pronunciation:\n${data.prompt}`,
      expectedAnswer: data.expected,
      hint: data.expected,
    };
  });
}

/**
 * Connectives and filler words that are correct but not strictly required.
 * Present in expected answers for completeness; missing them doesn't penalize.
 */
const OPTIONAL_FILLER = new Set([
  "I",
  "HAVE",
  "AND",
  "AM",
  "IS",
  "A",
  "THE",
  "ON",
  "IN",
  "TO",
  "MY",
  "OF",
  "WITH",
  "ARE",
  "REQUIRE",
  "BOARD",
]);

/** Map digit strings and common number words to a canonical form for comparison. */
const NUMBER_WORDS: Record<string, string> = {
  "0": "ZERO",
  "1": "ONE",
  "2": "TWO",
  "3": "THREE",
  "4": "FOUR",
  "5": "FIVE",
  "6": "SIX",
  "7": "SEVEN",
  "8": "EIGHT",
  "9": "NINE",
};

function normalizeAnswer(raw: string): string[] {
  return raw
    .toUpperCase()
    .replace(/°/g, " DEGREES ")
    .replace(/['′]/g, " MINUTES ")
    .replace(/[",.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token) => {
      if (/^\d+$/.test(token)) {
        return token.split("").map((d) => NUMBER_WORDS[d] ?? d);
      }
      return [token];
    });
}

/**
 * Maritime ↔ standard number word equivalences.
 * Users may type either form; both score correctly.
 */
const MARITIME_EQUIVALENTS: Record<string, string> = {
  ONE: "WUN",
  WUN: "ONE",
  TWO: "TOO",
  TOO: "TWO",
  THREE: "TREE",
  TREE: "THREE",
  FOUR: "FOW-ER",
  "FOW-ER": "FOUR",
  FIVE: "FIFE",
  FIFE: "FIVE",
  EIGHT: "AIT",
  AIT: "EIGHT",
  NINE: "NIN-ER",
  "NIN-ER": "NINE",
};

/** Critical radio vocabulary — must match exactly (e.g. EAST vs WEST). */
const PROTECTED_TOKENS = new Set([
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "LEFT",
  "RIGHT",
  "RED",
  "GREEN",
  "WHITE",
  "BLUE",
  "BLACK",
  "OVER",
  "OUT",
  "MAYDAY",
  "PAN",
  "SECURITE",
  "DEGREES",
  "MINUTES",
  "KNOTS",
]);

function tokensMatch(answer: string, expected: string): boolean {
  if (answer === expected) return true;

  if (MARITIME_EQUIVALENTS[answer] === expected || MARITIME_EQUIVALENTS[expected] === answer) {
    return true;
  }

  const isNumericExpected = /^\d+$/.test(expected);
  const isNumericAnswer = /^\d+$/.test(answer);

  if (PROTECTED_TOKENS.has(answer) || PROTECTED_TOKENS.has(expected)) {
    return false;
  }

  if (!isNumericExpected && !isNumericAnswer) {
    return levenshteinDistance(answer, expected) <= 1;
  }

  if (isNumericAnswer && !isNumericExpected) {
    return NUMBER_WORDS[answer] === expected;
  }

  if (!isNumericAnswer && isNumericExpected) {
    return NUMBER_WORDS[expected] === answer;
  }

  return false;
}

/** Score a drill answer against expected (order-sensitive). */
export function scoreDrill(challenge: DrillChallenge, studentAnswer: string): DrillResult {
  const expectedWords = challenge.expectedAnswer.toUpperCase().split(/\s+/);
  const answerWords = normalizeAnswer(studentAnswer);

  const matched: string[] = [];
  const missed: string[] = [];

  let answerIdx = 0;
  for (const expected of expectedWords) {
    let found = false;
    for (let i = answerIdx; i < answerWords.length; i++) {
      if (tokensMatch(answerWords[i]!, expected)) {
        matched.push(expected);
        answerIdx = i + 1;
        found = true;
        break;
      }
    }
    if (!found) {
      missed.push(expected);
    }
  }

  const requiredExpected = expectedWords.filter((w) => !OPTIONAL_FILLER.has(w));
  const requiredMatched = matched.filter((w) => !OPTIONAL_FILLER.has(w));
  const requiredMissed = missed.filter((w) => !OPTIONAL_FILLER.has(w));

  const score =
    requiredExpected.length > 0
      ? Math.round((requiredMatched.length / requiredExpected.length) * 100)
      : 100;

  return { challenge, studentAnswer, score, matchedWords: matched, missedWords: requiredMissed };
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }

  return dp[m]![n]!;
}
