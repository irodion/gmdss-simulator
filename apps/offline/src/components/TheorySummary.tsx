import type { TheoryResult } from "../drills/theory-mode.ts";

interface TheorySummaryProps {
  readonly results: readonly TheoryResult[];
  readonly onRestart: () => void;
}

export function TheorySummary({ results, onRestart }: TheorySummaryProps) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div>
      <div className="summary-eyebrow">— Theory review —</div>
      <h2 className="summary-heading">
        {total} question{total === 1 ? "" : "s"}, marked
      </h2>
      <div className="summary-score" aria-label={`Score ${pct} out of 100`}>
        {pct}
        <sup>/100</sup>
      </div>
      <span className="summary-rule" aria-hidden="true" />
      <p className="summary-detail">
        <strong>{correct}</strong> correct · over <strong>{total}</strong>
      </p>
      <button type="button" className="btn-primary btn-block" onClick={onRestart}>
        Begin a new watch
      </button>
    </div>
  );
}
