import type { DrillResult } from "../drills/drill-types.ts";

interface SessionResultsProps {
  readonly results: readonly DrillResult[];
  readonly onRestart: () => void;
}

const TOTAL_WORDS: Record<number, string> = {
  5: "Five",
  10: "Ten",
  20: "Twenty",
};

export function SessionResults({ results, onRestart }: SessionResultsProps) {
  const total = results.length;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const average = total > 0 ? Math.round(sum / total) : 0;
  const perfect = results.filter((r) => r.score === 100).length;
  const headingTotal = TOTAL_WORDS[total] ?? String(total);

  return (
    <div>
      <div className="summary-eyebrow">— Logbook entry —</div>
      <h2 className="summary-heading">{headingTotal} transmissions, posted</h2>
      <div className="summary-score" aria-label={`Average score ${average} out of 100`}>
        {average}
        <sup>/100</sup>
      </div>
      <span className="summary-rule" aria-hidden="true" />
      <p className="summary-detail">
        <strong>{perfect}</strong> perfect · over <strong>{total}</strong>
      </p>
      <button type="button" className="btn-primary btn-block" onClick={onRestart}>
        Begin a new watch
      </button>
    </div>
  );
}
