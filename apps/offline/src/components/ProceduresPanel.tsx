import { useCallback, useEffect, useMemo, useState } from "react";
import { loadScriptDrillContent } from "../drills/scripts/content-loader.ts";
import { materializeStructural } from "../drills/scripts/materialize.ts";
import { recordAttempt } from "../drills/scripts/stats.ts";
import type {
  ScriptDrillContent,
  SequenceGrade,
  SequenceTemplate,
  SituationalGrade,
} from "../drills/scripts/types.ts";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { SequenceCard } from "./SequenceCard.tsx";
import { SituationalCard } from "./SituationalCard.tsx";

type View =
  | { kind: "home" }
  | { kind: "structural"; template: SequenceTemplate; round: number }
  | { kind: "situational"; scenarioId: string };

export function ProceduresPanel() {
  const [content, setContent] = useState<ScriptDrillContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [statsToken, setStatsToken] = useState(0);

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

  const handleStartStructural = useCallback(() => {
    if (!content) return;
    const template = materializeStructural(content.structuralRubric);
    setView({ kind: "structural", template, round: 0 });
  }, [content]);

  const handleStartSituational = useCallback((scenarioId: string) => {
    setView({ kind: "situational", scenarioId });
  }, []);

  const handleStructuralComplete = useCallback(
    (grade: SequenceGrade) => {
      if (view.kind !== "structural" || !content) return;
      recordAttempt({
        rubricId: content.structuralRubric.id,
        mode: "structural",
        key: content.structuralRubric.id,
        ts: Date.now(),
        correct: grade.passed,
      });
      setStatsToken((t) => t + 1);
    },
    [view, content],
  );

  const handleStructuralRestart = useCallback(() => {
    setView((v) => (v.kind === "structural" ? { ...v, round: v.round + 1 } : v));
  }, []);

  const handleSituationalComplete = useCallback(
    (grade: SituationalGrade) => {
      if (view.kind !== "situational" || !content) return;
      const rubric = content.rubricsByScenario.get(view.scenarioId);
      if (!rubric) return;
      recordAttempt({
        rubricId: rubric.id,
        mode: "situational",
        key: view.scenarioId,
        ts: Date.now(),
        correct: grade.passed,
      });
      setStatsToken((t) => t + 1);
    },
    [view, content],
  );

  const handleHome = useCallback(() => {
    setView({ kind: "home" });
  }, []);

  const situationalEntry = useMemo(() => {
    if (view.kind !== "situational" || !content) return null;
    const prompt = content.scenarios.find((s) => s.scenarioId === view.scenarioId);
    if (!prompt) return null;
    const rubric = content.rubricsByScenario.get(prompt.scenarioId);
    if (!rubric) return null;
    return { prompt, rubric };
  }, [view, content]);

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

  if (view.kind === "structural") {
    return (
      <SequenceCard
        key={view.round}
        template={view.template}
        onComplete={handleStructuralComplete}
        onRestart={handleStructuralRestart}
        onBack={handleHome}
      />
    );
  }

  if (view.kind === "situational" && situationalEntry) {
    return (
      <SituationalCard
        prompt={situationalEntry.prompt}
        rubric={situationalEntry.rubric}
        onComplete={handleSituationalComplete}
        onRestart={() => handleStartSituational(situationalEntry.prompt.scenarioId)}
        onBack={handleHome}
      />
    );
  }

  return (
    <ProceduresHome
      content={content}
      statsToken={statsToken}
      onStartStructural={handleStartStructural}
      onStartSituational={handleStartSituational}
    />
  );
}
