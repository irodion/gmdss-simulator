import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readAdaptivePreference } from "../drills/adaptive-prefs.ts";
import { readEvents } from "../drills/learning-events.ts";
import { pickAdaptiveScenario } from "../drills/scripts/adaptive-scenarios.ts";
import { loadScriptDrillContent } from "../drills/scripts/content-loader.ts";
import { materializeScenario } from "../drills/scripts/materialize.ts";
import { recordAttempt } from "../drills/scripts/stats.ts";
import {
  SCENARIO_STATS_KEY,
  type DimensionId,
  type Scenario,
  type ScenarioBank,
  type ScriptDrillContent,
  type SequenceGrade,
  type SequenceTemplate,
} from "../drills/scripts/types.ts";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { SequenceCard } from "./SequenceCard.tsx";

type View =
  | { kind: "home" }
  | {
      kind: "scenario";
      scenario: Scenario;
      template: SequenceTemplate;
      round: number;
    };

export function ProceduresPanel() {
  const [content, setContent] = useState<ScriptDrillContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [statsToken, setStatsToken] = useState(0);
  const recentScenarioId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadScriptDrillContent()
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startScenario = useCallback((c: ScriptDrillContent) => {
    const scenario = readAdaptivePreference()
      ? pickAdaptiveScenario(c.scenarios, readEvents(), recentScenarioId.current)
      : pickScenario(c.scenarios, recentScenarioId.current);
    if (!scenario) return;
    recentScenarioId.current = scenario.id;
    const template = materializeScenario(scenario, c.rubrics);
    setView((prev) => ({
      kind: "scenario",
      scenario,
      template,
      round: (prev.kind === "scenario" ? prev.round : 0) + 1,
    }));
  }, []);

  const handleStart = useCallback(() => {
    if (!content) return;
    startScenario(content);
  }, [content, startScenario]);

  const handleComplete = useCallback(
    (grade: SequenceGrade) => {
      if (view.kind !== "scenario") return;
      const dimensionPasses = {} as Record<DimensionId, boolean>;
      for (const d of grade.dimensions) {
        dimensionPasses[d.id] = d.status === "pass";
      }
      recordAttempt({
        rubricId: view.template.rubricId,
        mode: "scenario",
        key: SCENARIO_STATS_KEY,
        ts: Date.now(),
        correct: grade.passed,
        scenarioId: view.scenario.id,
        dimensionPasses,
      });
      setStatsToken((t) => t + 1);
    },
    [view],
  );

  const handleRetry = useCallback(() => {
    setView((v) => {
      if (v.kind !== "scenario" || !content) return v;
      const template = materializeScenario(v.scenario, content.rubrics);
      return { ...v, template, round: v.round + 1 };
    });
  }, [content]);

  const handleNewScenario = useCallback(() => {
    if (!content) return;
    startScenario(content);
  }, [content, startScenario]);

  const handleHome = useCallback(() => {
    setView({ kind: "home" });
  }, []);

  const scenarioCount = useMemo(() => content?.scenarios.scenarios.length ?? 0, [content]);

  if (error) {
    return (
      <div className="proc-error">
        <p>Couldn't load the procedure content: {error}</p>
        <p className="help">Try a hard refresh; the rubrics ship inside the offline bundle.</p>
      </div>
    );
  }

  if (!content) {
    return <div className="proc-loading">Loading procedures…</div>;
  }

  if (view.kind === "scenario") {
    return (
      <SequenceCard
        key={view.round}
        template={view.template}
        scenario={view.scenario}
        onComplete={handleComplete}
        onRetry={handleRetry}
        onNewScenario={handleNewScenario}
        onBack={handleHome}
      />
    );
  }

  return (
    <ProceduresHome
      statsKey={SCENARIO_STATS_KEY}
      statsToken={statsToken}
      scenarioCount={scenarioCount}
      onStart={handleStart}
    />
  );
}

function pickScenario(bank: ScenarioBank, excludeId: string | null): Scenario | null {
  const all = bank.scenarios;
  if (all.length === 0) return null;
  if (all.length === 1) return all[0]!;
  const candidates = excludeId ? all.filter((s) => s.id !== excludeId) : all;
  const pool = candidates.length > 0 ? candidates : all;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? pool[0]!;
}
