import type { DrillResult } from "../drills/drill-types.ts";

interface SessionResultsProps {
  readonly results: readonly DrillResult[];
  readonly onRestart: () => void;
}

export function SessionResults({ results, onRestart }: SessionResultsProps) {
  const total = results.length;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const average = total > 0 ? Math.round(sum / total) : 0;
  const perfect = results.filter((r) => r.score === 100).length;

  return (
    <div>
      <div className="summary-score">{average}</div>
      <div className="summary-detail">
        Average score · {perfect} of {total} perfect
      </div>
      <button type="button" className="btn-primary btn-block" onClick={onRestart}>
        Start a new session
      </button>
    </div>
  );
}
