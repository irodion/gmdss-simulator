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
  const icon = state === "correct" ? "✓" : state === "partial" ? "≈" : "✗";

  return (
    <div className="result-row" data-state={state} role="status">
      <div className="result-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="result-meta">
        <div>Correct answer: {correctAnswer}</div>
        {result.missedWords.length > 0 ? <div>Missed: {result.missedWords.join(" ")}</div> : null}
      </div>
      <div className="result-score">{result.score}</div>
    </div>
  );
}
