import { useEffect, useState } from "react";
import { getAggregateFor, type StatsAggregate } from "../drills/scripts/stats.ts";

interface ProceduresHomeProps {
  readonly statsKey: string;
  readonly statsToken: number;
  readonly scenarioCount: number;
  readonly onStart: () => void;
}

function pct(agg: StatsAggregate | null): string {
  if (agg == null) return "—";
  return `${agg.pctCorrect}% over ${agg.attempts}`;
}

function statLabel(agg: StatsAggregate | null): string {
  if (agg == null) return "no attempts yet";
  return `${agg.pctCorrect}% correct over ${agg.attempts} attempts`;
}

export function ProceduresHome({
  statsKey,
  statsToken,
  scenarioCount,
  onStart,
}: ProceduresHomeProps) {
  const [stats, setStats] = useState<StatsAggregate | null>(null);

  useEffect(() => {
    setStats(getAggregateFor("scenario", statsKey));
  }, [statsKey, statsToken]);

  return (
    <div>
      <div className="section-eyebrow">Procedures</div>
      <p className="section-prompt">Build the right radio call from a scenario.</p>

      <div className="proc-tiles">
        <button
          type="button"
          className="proc-tile"
          onClick={onStart}
          aria-label={`Scenario reconstruction drill, ${statLabel(stats)}`}
        >
          <span className="proc-tile-eyebrow">Scenario</span>
          <span className="proc-tile-title">Scenario reconstruction</span>
          <span className="proc-tile-detail">
            Pick the priority and order the phrases · {scenarioCount} scenarios.
          </span>
          <span className="proc-tile-stat">{pct(stats)}</span>
        </button>
      </div>
    </div>
  );
}
