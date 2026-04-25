/**
 * Browser STT typically returns standard English ("ate", "tree", "niner") for
 * maritime words ("AIT", "TREE", "NIN-ER"). We normalize the transcript to the
 * forms users see in prompts so the answer field reads cleanly. Scoring still
 * accepts both forms via MARITIME_EQUIVALENTS, so this is purely cosmetic.
 */
const STT_NORMALIZATIONS: Record<string, string> = {
  // Maritime number forms → standard English (cosmetic; scorer accepts both).
  ATE: "EIGHT",
  TREE: "THREE",
  FIFE: "FIVE",
  NINER: "NINE",
  WUN: "ONE",
  TOO: "TWO",
  FOWER: "FOUR",
  "FOW-ER": "FOUR",
  // Common STT homophone misrecognitions.
  WON: "ONE",
  FOR: "FOUR",
  OH: "ZERO",
  // Phonetic alphabet variants STT engines emit.
  ALPHA: "ALFA",
  JULIETT: "JULIET",
  "X-RAY": "XRAY",
};

const DIGIT_WORDS: Record<string, string> = {
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

export function applyNormalization(transcript: string): string {
  return transcript
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((raw) => {
      // Strip surrounding punctuation Chrome STT can emit (".", ",", "!"),
      // preserving hyphens so keys like "X-RAY" / "FOW-ER" still match.
      const token = raw.replace(/^[^A-Z0-9-]+|[^A-Z0-9-]+$/g, "");
      if (token === "") return [];
      if (/^\d+$/.test(token)) {
        return token.split("").map((d) => DIGIT_WORDS[d] ?? d);
      }
      return [STT_NORMALIZATIONS[token] ?? token];
    })
    .join(" ");
}
