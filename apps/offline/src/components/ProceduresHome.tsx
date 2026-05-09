import { useEffect, useState } from "react";
import { getAggregateFor, type StatsAggregate } from "../drills/scripts/stats.ts";
import type { PriorityId } from "../drills/scripts/types.ts";

interface DailyScenarioMeta {
  readonly id: string;
  readonly vesselName: string;
  readonly priority: PriorityId;
}

interface DailyTile {
  readonly scenario: DailyScenarioMeta;
  readonly dateLabel: string;
  readonly doneToday: boolean;
  readonly onStart: () => void;
}

interface ProceduresHomeProps {
  readonly statsKey: string;
  readonly statsToken: number;
  readonly scenarioCount: number;
  readonly onStart: () => void;
  readonly daily?: DailyTile | null;
}

const PRIORITY_LABELS: Readonly<Record<PriorityId, string>> = {
  mayday: "MAYDAY",
  pan_pan: "PAN PAN",
  securite: "SECURITE",
};

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
  daily = null,
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

        {daily ? (
          <button
            type="button"
            className="proc-tile proc-tile-daily"
            onClick={daily.onStart}
            data-done={daily.doneToday ? "true" : "false"}
            aria-label={
              daily.doneToday
                ? `Daily Scenario, completed today, tap to retry`
                : `Today's Daily Scenario, ${daily.scenario.vesselName}, tap to start`
            }
          >
            <span className="proc-tile-eyebrow">Today · {daily.dateLabel}</span>
            <span className="proc-tile-title">
              <span className="proc-tile-priority" data-priority={daily.scenario.priority}>
                {PRIORITY_LABELS[daily.scenario.priority]}
              </span>{" "}
              {daily.scenario.vesselName}
            </span>
            <span className="proc-tile-detail">Same scenario for everyone today.</span>
            <span className="proc-tile-stat">
              {daily.doneToday ? "Done today, come back tomorrow" : "Tap to start"}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
