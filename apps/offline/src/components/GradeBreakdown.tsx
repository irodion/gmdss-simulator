import type { ScoreBreakdown } from "@gmdss-simulator/utils";

interface GradeBreakdownProps {
  readonly breakdown: ScoreBreakdown;
}

export function GradeBreakdown({ breakdown }: GradeBreakdownProps) {
  return (
    <div className="grade-breakdown">
      <div className="grade-overall" aria-label={`Overall score ${breakdown.overall} out of 100`}>
        {breakdown.overall}
        <sup>/100</sup>
      </div>
      <ul className="grade-dimensions">
        {breakdown.dimensions.map((d) => (
          <li
            key={d.id}
            className="grade-dim"
            data-state={d.score === 100 ? "pass" : d.score === 0 ? "fail" : "partial"}
          >
            <div className="grade-dim-head">
              <span className="grade-dim-label">{d.label}</span>
              <span className="grade-dim-score">
                {d.score}
                <small>/100</small>
              </span>
            </div>
            {d.missingItems.length > 0 ? (
              <div className="grade-dim-missed">Missed: {d.missingItems.join(", ")}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
