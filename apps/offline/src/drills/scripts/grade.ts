import { scoreTranscript, type RubricDefinition, type Turn } from "@gmdss-simulator/utils";
import { PASS_THRESHOLD, type SituationalGrade, type SituationalPrompt } from "./types.ts";

/**
 * Synthesize a single student turn on the scenario's required channel and
 * delegate to the shared rubric engine. `dscContext` is intentionally omitted
 * — this drill is voice-only and pretending the DSC alert "was sent" would
 * inflate the score and mislead the student.
 */
export function gradeAgainst(
  prompt: SituationalPrompt,
  rubric: RubricDefinition,
  text: string,
): SituationalGrade {
  const turn: Turn = {
    index: 0,
    speaker: "student",
    text,
    timestamp: Date.now(),
    channel: prompt.requiredChannel,
    durationMs: 0,
  };
  const breakdown = scoreTranscript([turn], rubric, prompt.requiredChannel);
  return {
    breakdown,
    passed: breakdown.overall >= PASS_THRESHOLD,
  };
}
