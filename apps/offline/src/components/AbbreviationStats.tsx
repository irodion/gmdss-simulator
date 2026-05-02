import { useEffect, useState } from "react";
import {
  clearAbbreviationStats,
  getAbbreviationAggregates,
  type AbbrAggregate,
} from "../drills/abbreviation-stats.ts";

interface AbbreviationStatsProps {
  /** Bumped by the parent after each session so this panel re-reads from storage. */
  readonly refreshToken: number;
}

function compare(a: AbbrAggregate, b: AbbrAggregate): number {
  if (a.pctCorrect !== b.pctCorrect) return a.pctCorrect - b.pctCorrect;
  if (a.attempts !== b.attempts) return b.attempts - a.attempts;
  return a.abbr.localeCompare(b.abbr);
}

export function AbbreviationStats({ refreshToken }: AbbreviationStatsProps) {
  const [rows, setRows] = useState<AbbrAggregate[]>([]);

  useEffect(() => {
    setRows(getAbbreviationAggregates().slice().sort(compare));
  }, [refreshToken]);

  function handleReset() {
    clearAbbreviationStats();
    setRows([]);
  }

  if (rows.length === 0) {
    return (
      <div className="abbr-stats-empty">
        <span className="section-eyebrow">Logbook</span>
        <p className="section-prompt">No attempts yet — your progress will appear here.</p>
      </div>
    );
  }

  return (
    <div className="abbr-stats">
      <div className="abbr-stats-head">
        <span className="section-eyebrow">Logbook · weakest first</span>
        <button type="button" className="btn-link" onClick={handleReset}>
          Reset stats
        </button>
      </div>
      <table className="abbr-stats-table">
        <thead>
          <tr>
            <th scope="col">Abbreviation</th>
            <th scope="col">Attempts</th>
            <th scope="col">Correct</th>
            <th scope="col">Pct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.abbr}>
              <td>{row.abbr}</td>
              <td>{row.attempts}</td>
              <td>
                {row.correct}/{row.attempts}
              </td>
              <td>{row.pctCorrect}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
