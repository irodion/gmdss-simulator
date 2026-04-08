export type DrillType = "phonetic" | "number-pronunciation" | "script-reading";

export interface DrillChallenge {
  readonly id: string;
  readonly type: DrillType;
  readonly prompt: string;
  readonly expectedAnswer: string;
  readonly hint?: string;
}

export interface DrillResult {
  readonly challenge: DrillChallenge;
  readonly studentAnswer: string;
  readonly score: number; // 0–100
  readonly matchedWords: readonly string[];
  readonly missedWords: readonly string[];
}

/** NATO phonetic alphabet mapping */
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

// ── Script Reading challenges ──

const SCRIPT_CHALLENGES: { prompt: string; expected: string }[] = [
  {
    prompt:
      "Read the following MAYDAY call aloud:\n\nVessel: M/V BLUE DUCK\nNature: Fire on board\nPosition: 50°10'N 001°25'W\nPersons on board: 12\nAssistance required: Immediate",
    expected:
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK MAYDAY BLUE DUCK MY POSITION IS FIVE ZERO DEGREES ONE ZERO MINUTES NORTH ZERO ZERO ONE DEGREES TWO FIVE MINUTES WEST I HAVE FIRE ON BOARD AND REQUIRE IMMEDIATE ASSISTANCE ONE TWO PERSONS ON BOARD OVER",
  },
  {
    prompt:
      "Read the following PAN PAN call aloud:\n\nVessel: M/V BLUE DUCK\nNature: Engine failure, drifting\nPosition: 48°22'N 004°48'W\nPersons on board: 8\nAssistance required: Tow",
    expected:
      "PAN PAN PAN PAN PAN PAN ALL STATIONS ALL STATIONS ALL STATIONS THIS IS BLUE DUCK BLUE DUCK BLUE DUCK I HAVE ENGINE FAILURE AND AM DRIFTING MY POSITION IS FOUR EIGHT DEGREES TWO TWO MINUTES NORTH ZERO ZERO FOUR DEGREES FOUR EIGHT MINUTES WEST I REQUIRE A TOW EIGHT PERSONS ON BOARD OVER",
  },
  {
    prompt:
      "Read the following SECURITE broadcast aloud:\n\nVessel: M/V BLUE DUCK\nWarning: Unlit buoy\nPosition: 50°10'N 001°25'W",
    expected:
      "SECURITE SECURITE SECURITE ALL STATIONS ALL STATIONS ALL STATIONS THIS IS BLUE DUCK BLUE DUCK BLUE DUCK NAVIGATIONAL WARNING UNLIT BUOY IN POSITION FIVE ZERO DEGREES ONE ZERO MINUTES NORTH ZERO ZERO ONE DEGREES TWO FIVE MINUTES WEST MARINERS ARE ADVISED TO NAVIGATE WITH CAUTION OUT",
  },
  {
    prompt:
      "Read the following channel switch request aloud:\n\nVessel: M/V BLUE DUCK\nStation: Anytown Radio\nRequested working channel: 72",
    expected:
      "ANYTOWN RADIO ANYTOWN RADIO ANYTOWN RADIO THIS IS BLUE DUCK BLUE DUCK BLUE DUCK REQUEST CHANNEL SEVEN TWO OVER",
  },
  {
    prompt:
      "Read the following PAN PAN MEDICO call aloud:\n\nVessel: M/V BLUE DUCK\nNature: Crew member with head injury, conscious\nPosition: 51°28'N 003°12'W\nPersons on board: 6\nAssistance required: Medical advice",
    expected:
      "PAN PAN PAN PAN PAN PAN ALL STATIONS ALL STATIONS ALL STATIONS THIS IS BLUE DUCK BLUE DUCK BLUE DUCK I REQUIRE MEDICAL ADVICE CREW MEMBER WITH HEAD INJURY CONSCIOUS MY POSITION IS FIVE ONE DEGREES TWO EIGHT MINUTES NORTH ZERO ZERO THREE DEGREES ONE TWO MINUTES WEST SIX PERSONS ON BOARD OVER",
  },
  {
    prompt:
      "Read the following SECURITE correction aloud:\n\nVessel: M/V BLUE DUCK\nCorrection: Previous warning about unlit buoy — buoy now relit\nOriginal warning time: 1435 UTC\nPosition: 50°10'N 001°25'W",
    expected:
      "SECURITE SECURITE SECURITE ALL STATIONS ALL STATIONS ALL STATIONS THIS IS BLUE DUCK BLUE DUCK BLUE DUCK CANCEL MY SECURITE OF ONE FOUR THREE FIVE UTC BUOY IN POSITION FIVE ZERO DEGREES ONE ZERO MINUTES NORTH ZERO ZERO ONE DEGREES TWO FIVE MINUTES WEST NOW RELIT OUT",
  },
];

export function createScriptChallenge(index: number): DrillChallenge {
  const data = SCRIPT_CHALLENGES[index % SCRIPT_CHALLENGES.length]!;
  return {
    id: `script-${index}`,
    type: "script-reading",
    prompt: data.prompt,
    expectedAnswer: data.expected,
    hint: data.expected,
  };
}

// ── Number Pronunciation challenges ──

const NUMBER_CHALLENGES: { position: string; expected: string }[] = [
  {
    position: "36°08'N 005°21'W",
    expected: "TREE SIX DEGREES ZERO AIT MINUTES NORTH ZERO ZERO FIFE DEGREES TOO WUN MINUTES WEST",
  },
  {
    position: "51°28'N 003°12'W",
    expected: "FIFE WUN DEGREES TOO AIT MINUTES NORTH ZERO ZERO TREE DEGREES WUN TOO MINUTES WEST",
  },
  {
    position: "48°22'N 004°48'W",
    expected:
      "FOW-ER AIT DEGREES TOO TOO MINUTES NORTH ZERO ZERO FOW-ER DEGREES FOW-ER AIT MINUTES WEST",
  },
  {
    position: "50°10'N 001°25'W",
    expected:
      "FIFE ZERO DEGREES WUN ZERO MINUTES NORTH ZERO ZERO WUN DEGREES TOO FIFE MINUTES WEST",
  },
];

export function createNumberChallenge(index: number): DrillChallenge {
  const data = NUMBER_CHALLENGES[index % NUMBER_CHALLENGES.length]!;
  return {
    id: `number-${index}`,
    type: "number-pronunciation",
    prompt: `Read this position using maritime pronunciation:\n${data.position}`,
    expectedAnswer: data.expected,
    hint: data.expected,
  };
}

/**
 * Connectives and filler words that are correct but not strictly required
 * in radio procedure. Present in the expected script for completeness,
 * but missing them doesn't penalize the student.
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
  "10": "TEN",
  "11": "ELEVEN",
  "12": "TWELVE",
  "13": "THIRTEEN",
  "14": "FOURTEEN",
  "15": "FIFTEEN",
  "16": "SIXTEEN",
  "17": "SEVENTEEN",
  "18": "EIGHTEEN",
  "19": "NINETEEN",
  "20": "TWENTY",
  "25": "TWENTY-FIVE",
  "30": "THIRTY",
  "48": "FORTY-EIGHT",
  "50": "FIFTY",
};

/** Normalize answer tokens: convert symbols to words, expand digits per-digit. */
function normalizeAnswer(raw: string): string[] {
  return raw
    .toUpperCase()
    .replace(/°/g, " DEGREES ")
    .replace(/['′]/g, " MINUTES ")
    .replace(/[",.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token) => {
      // Digits → expand each digit to its word form (maritime pronunciation)
      if (/^\d+$/.test(token)) {
        return token.split("").map((d) => NUMBER_WORDS[d] ?? d);
      }
      return [token];
    });
}

/**
 * Maritime ↔ standard number word equivalences.
 * Speech recognition outputs standard English; expected scripts may use maritime pronunciation.
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

/** Check if an answer token matches an expected token, accounting for number word↔digit and maritime equivalence. */
function tokensMatch(answer: string, expected: string): boolean {
  if (answer === expected) return true;

  // Maritime equivalence: EIGHT ↔ AIT, ONE ↔ WUN, etc.
  if (MARITIME_EQUIVALENTS[answer] === expected || MARITIME_EQUIVALENTS[expected] === answer) {
    return true;
  }

  const isNumericExpected = /^\d+$/.test(expected);
  const isNumericAnswer = /^\d+$/.test(answer);

  // Critical radio vocabulary — require exact match (EAST vs WEST = edit distance 1)
  const PROTECTED = new Set([
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
  if (PROTECTED.has(answer) || PROTECTED.has(expected)) {
    return false; // exact match already checked above
  }

  // Fuzzy match for non-numeric, non-protected words
  if (!isNumericExpected && !isNumericAnswer) {
    return levenshteinDistance(answer, expected) <= 1;
  }

  // "12" in answer vs "TWELVE" expected
  if (isNumericAnswer && !isNumericExpected) {
    return NUMBER_WORDS[answer] === expected;
  }

  // "TWELVE" in answer vs "12" expected
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

  // Only required (non-filler) words count toward the score
  const requiredExpected = expectedWords.filter((w) => !OPTIONAL_FILLER.has(w));
  const requiredMatched = matched.filter((w) => !OPTIONAL_FILLER.has(w));
  const requiredMissed = missed.filter((w) => !OPTIONAL_FILLER.has(w));

  const score =
    requiredExpected.length > 0
      ? Math.round((requiredMatched.length / requiredExpected.length) * 100)
      : 100;

  return { challenge, studentAnswer, score, matchedWords: matched, missedWords: requiredMissed };
}

/** Simple Levenshtein distance for fuzzy matching. */
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
