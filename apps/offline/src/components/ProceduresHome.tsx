import { useEffect, useState } from "react";
import { getAggregateFor, type StatsAggregate } from "../drills/scripts/stats.ts";
import type { ScriptDrillContent } from "../drills/scripts/types.ts";

interface ProceduresHomeProps {
  readonly content: ScriptDrillContent;
  readonly statsToken: number;
  readonly onStartStructural: () => void;
  readonly onStartSituational: (scenarioId: string) => void;
}

function pct(agg: StatsAggregate | null): string {
  if (agg == null) return "—";
  return `${agg.pctCorrect}% over ${agg.attempts}`;
}

export function ProceduresHome({
  content,
  statsToken,
  onStartStructural,
  onStartSituational,
}: ProceduresHomeProps) {
  const [structuralStats, setStructuralStats] = useState<StatsAggregate | null>(null);
  const [situationalStats, setSituationalStats] = useState<Map<string, StatsAggregate | null>>(
    new Map(),
  );

  useEffect(() => {
    setStructuralStats(getAggregateFor("structural", content.structuralRubric.id));
    const next = new Map<string, StatsAggregate | null>();
    for (const s of content.scenarios) {
      next.set(s.scenarioId, getAggregateFor("situational", s.scenarioId));
    }
    setSituationalStats(next);
  }, [content, statsToken]);

  return (
    <div>
      <div className="section-eyebrow">Procedures</div>
      <p className="section-prompt">
        Drill the order and content of a MAYDAY call. Pick a mode below.
      </p>

      <div className="proc-tiles">
        <button
          type="button"
          className="proc-tile"
          onClick={onStartStructural}
          aria-label={`Structural drill, ${pct(structuralStats)} correct`}
        >
          <span className="proc-tile-eyebrow">Structural</span>
          <span className="proc-tile-title">Order of fields</span>
          <span className="proc-tile-detail">
            What comes after each element? ·{" "}
            {content.structuralRubric.sequenceRules.fieldOrder.length} fields, multiple-choice.
          </span>
          <span className="proc-tile-stat">{pct(structuralStats)}</span>
        </button>

        {content.scenarios.map((s) => (
          <button
            key={s.scenarioId}
            type="button"
            className="proc-tile"
            onClick={() => onStartSituational(s.scenarioId)}
            aria-label={`Situational drill: ${s.title}, ${pct(situationalStats.get(s.scenarioId) ?? null)} correct`}
          >
            <span className="proc-tile-eyebrow">Situational · {s.scenarioId}</span>
            <span className="proc-tile-title">{s.title}</span>
            <span className="proc-tile-detail">{s.description}</span>
            <span className="proc-tile-stat">
              {pct(situationalStats.get(s.scenarioId) ?? null)}
            </span>
          </button>
        ))}
      </div>

      <p className="help">
        Situational drills assume the DSC alert has been sent — this drill grades only the voice
        call.
      </p>
    </div>
  );
}
