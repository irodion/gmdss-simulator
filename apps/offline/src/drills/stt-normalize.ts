/**
 * Browser STT typically returns standard English ("ate", "tree", "niner") for
 * maritime words ("AIT", "TREE", "NIN-ER"). We normalize the transcript to the
 * forms users see in prompts so the answer field reads cleanly. Scoring still
 * accepts both forms via MARITIME_EQUIVALENTS, so this is purely cosmetic.
 */
const STT_NORMALIZATIONS: Record<string, string> = {
  ATE: "EIGHT",
  TREE: "THREE",
  FIFE: "FIVE",
  NINER: "NINE",
  WUN: "ONE",
  TOO: "TWO",
  FOWER: "FOUR",
  "FOW-ER": "FOUR",
  ALPHA: "ALFA",
  "X-RAY": "XRAY",
};

export function applyNormalization(transcript: string): string {
  return transcript
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => STT_NORMALIZATIONS[w] ?? w)
    .join(" ");
}
