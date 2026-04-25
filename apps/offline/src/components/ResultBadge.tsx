import type { DrillResult } from "../drills/drill-types.ts";

interface ResultBadgeProps {
  readonly result: DrillResult;
  readonly correctAnswer: string;
}

function stateOf(score: number): "correct" | "partial" | "wrong" {
  if (score >= 100) return "correct";
  if (score >= 50) return "partial";
  return "wrong";
}

export function ResultBadge({ result, correctAnswer }: ResultBadgeProps) {
  const state = stateOf(result.score);
  const mark = state === "correct" ? "✓" : state === "partial" ? "≈" : "✗";
  const note =
    state === "correct"
      ? "Logged. Move on when ready."
      : state === "partial"
        ? "Close. Note the marks below."
        : "Try again on the next call.";

  return (
    <div className="stamp" data-state={state} role="status">
      <span className="stamp-mark" aria-hidden="true">
        {mark}
      </span>
      <div className="stamp-meta">
        <span className="stamp-meta-key">{correctAnswer}</span>
        {result.missedWords.length > 0 ? (
          <span>Missed: {result.missedWords.join(" ")}</span>
        ) : (
          <span>{note}</span>
        )}
      </div>
      <span className="stamp-score">{result.score}</span>
    </div>
  );
}
