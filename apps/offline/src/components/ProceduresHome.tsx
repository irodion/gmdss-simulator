import { useEffect, useState } from "react";
import { getAggregateFor, type StatsAggregate } from "../drills/scripts/stats.ts";
import type { ScriptDrillContent } from "../drills/scripts/types.ts";

interface ProceduresHomeProps {
  readonly content: ScriptDrillContent;
  readonly statsToken: number;
  readonly onStartStructural: () => void;
}

function pct(agg: StatsAggregate | null): string {
  if (agg == null) return "—";
  return `${agg.pctCorrect}% over ${agg.attempts}`;
}

function statLabel(agg: StatsAggregate | null): string {
  if (agg == null) return "no attempts yet";
  return `${agg.pctCorrect}% correct over ${agg.attempts} attempts`;
}

export function ProceduresHome({ content, statsToken, onStartStructural }: ProceduresHomeProps) {
  const [structuralStats, setStructuralStats] = useState<StatsAggregate | null>(null);

  useEffect(() => {
    setStructuralStats(getAggregateFor("structural", content.structuralRubric.id));
  }, [content, statsToken]);

  const elementCount = (content.structuralRubric.sequenceParts ?? []).reduce(
    (n, part) => n + part.items.length,
    0,
  );

  return (
    <div>
      <div className="section-eyebrow">Procedures</div>
      <p className="section-prompt">
        Drill the order of a MAYDAY call. More scenarios coming soon.
      </p>

      <div className="proc-tiles">
        <button
          type="button"
          className="proc-tile"
          onClick={onStartStructural}
          aria-label={`Order of phrases drill, ${statLabel(structuralStats)}`}
        >
          <span className="proc-tile-eyebrow">Structural</span>
          <span className="proc-tile-title">Order of phrases</span>
          <span className="proc-tile-detail">
            Place each element in the correct order · {elementCount} elements.
          </span>
          <span className="proc-tile-stat">{pct(structuralStats)}</span>
        </button>
      </div>
    </div>
  );
}
