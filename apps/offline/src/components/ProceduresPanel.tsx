import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocalDateKey } from "../lib/date-utils.ts";
import { readAdaptivePreference } from "../drills/adaptive-prefs.ts";
import {
  applySessionAndPersist,
  markDailyScenarioCompleteAndPersist,
  readDailyProgress,
} from "../drills/daily-progress.ts";
import { readEvents } from "../drills/learning-events.ts";
import { pickAdaptiveScenario } from "../drills/scripts/adaptive-scenarios.ts";
import { loadScriptDrillContent } from "../drills/scripts/content-loader.ts";
import { pickDailyScenarioId } from "../drills/scripts/daily-scenario.ts";
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
      /** Adaptive preference snapshot at scenario start — locks the run's classification. */
      readonly startedAdaptive: boolean;
      /** Daily Scenario flag — completion writes lastDailyScenarioDate (once per day). */
      readonly isDaily: boolean;
    };

interface ProceduresPanelProps {
  /** Called after each scenario completion so the daily indicator updates. */
  readonly onSessionRecorded?: () => void;
}

export function ProceduresPanel({ onSessionRecorded }: ProceduresPanelProps = {}) {
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
    const adaptive = readAdaptivePreference();
    const scenario = adaptive
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
      startedAdaptive: adaptive,
      isDaily: false,
    }));
  }, []);

  const startDailyScenario = useCallback(
    (c: ScriptDrillContent) => {
      const today = getLocalDateKey(Date.now());
      const id = pickDailyScenarioId(c.scenarios, today);
      const scenario = id != null ? c.scenarios.scenarios.find((s) => s.id === id) : null;
      if (!scenario) {
        startScenario(c);
        return;
      }
      recentScenarioId.current = scenario.id;
      const template = materializeScenario(scenario, c.rubrics);
      setView((prev) => ({
        kind: "scenario",
        scenario,
        template,
        round: (prev.kind === "scenario" ? prev.round : 0) + 1,
        startedAdaptive: readAdaptivePreference(),
        isDaily: true,
      }));
    },
    [startScenario],
  );

  const handleStart = useCallback(() => {
    if (!content) return;
    startScenario(content);
  }, [content, startScenario]);

  const handleStartDaily = useCallback(() => {
    if (!content) return;
    startDailyScenario(content);
  }, [content, startDailyScenario]);

  const handleComplete = useCallback(
    (grade: SequenceGrade) => {
      if (view.kind !== "scenario") return;
      const dimensionPasses = {} as Record<DimensionId, boolean>;
      for (const d of grade.dimensions) {
        dimensionPasses[d.id] = d.status === "pass";
      }
      const now = Date.now();
      const today = getLocalDateKey(now);
      recordAttempt({
        rubricId: view.template.rubricId,
        mode: "scenario",
        key: SCENARIO_STATS_KEY,
        ts: now,
        correct: grade.passed,
        scenarioId: view.scenario.id,
        dimensionPasses,
      });
      // Daily-goal accounting: one scenario completion = 5 items, matching
      // the per-dimension event fan-out granularity in the unified store.
      // Use the preference snapshot taken at start so a mid-scenario toggle
      // can't reclassify the run. Re-launching today's Daily Scenario plays
      // but doesn't re-credit — preserves the streak's ungameable property.
      const adaptive = view.startedAdaptive;
      const alreadyCreditedToday =
        view.isDaily && readDailyProgress().lastDailyScenarioDate === today;
      if (!alreadyCreditedToday) {
        applySessionAndPersist({
          adaptiveItems: adaptive ? 5 : 0,
          freeItems: adaptive ? 0 : 5,
          now,
        });
        if (view.isDaily) markDailyScenarioCompleteAndPersist(today);
      }
      setStatsToken((t) => t + 1);
      onSessionRecorded?.();
    },
    [view, onSessionRecorded],
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

  const todayKey = getLocalDateKey(Date.now());
  const daily = useMemo(() => {
    if (!content) return null;
    const id = pickDailyScenarioId(content.scenarios, todayKey);
    if (!id) return null;
    const s = content.scenarios.scenarios.find((sc) => sc.id === id);
    if (!s) return null;
    const [year, month, day] = todayKey.split("-").map(Number);
    const dateLabel = new Date(year!, month! - 1, day!).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const doneToday = readDailyProgress().lastDailyScenarioDate === todayKey;
    return {
      scenario: { id: s.id, vesselName: s.facts.vessel, priority: s.priority },
      dateLabel,
      doneToday,
      onStart: handleStartDaily,
    };
    // statsToken changes after each scenario completion so doneToday refreshes.
  }, [content, todayKey, statsToken, handleStartDaily]);

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
      daily={daily}
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
