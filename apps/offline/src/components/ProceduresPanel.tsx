import { useCallback, useEffect, useMemo, useState } from "react";
import { loadScriptDrillContent } from "../drills/scripts/content-loader.ts";
import { materializeStructural } from "../drills/scripts/materialize.ts";
import { recordAttempt } from "../drills/scripts/stats.ts";
import type { MCQuestion, ScriptDrillContent, SituationalGrade } from "../drills/scripts/types.ts";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { SituationalCard } from "./SituationalCard.tsx";
import { StructuralCard } from "./StructuralCard.tsx";

type View =
  | { kind: "home" }
  | { kind: "structural"; questions: readonly MCQuestion[]; index: number; correct: number }
  | { kind: "structural-summary"; total: number; correct: number }
  | { kind: "situational"; scenarioId: string };

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

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
    const all = materializeStructural(content.structuralRubric);
    const questions = shuffle(all);
    setView({ kind: "structural", questions, index: 0, correct: 0 });
  }, [content]);

  const handleStartSituational = useCallback((scenarioId: string) => {
    setView({ kind: "situational", scenarioId });
  }, []);

  const handleStructuralAnswer = useCallback(
    (correct: boolean) => {
      if (view.kind !== "structural" || !content) return;
      const q = view.questions[view.index]!;
      recordAttempt({
        rubricId: q.rubricId,
        mode: "structural",
        key: content.structuralRubric.id,
        ts: Date.now(),
        correct,
      });
      setView((v) =>
        v.kind === "structural" ? { ...v, correct: v.correct + (correct ? 1 : 0) } : v,
      );
      setStatsToken((t) => t + 1);
    },
    [view, content],
  );

  const handleStructuralNext = useCallback(() => {
    if (view.kind !== "structural") return;
    const next = view.index + 1;
    if (next >= view.questions.length) {
      setView({ kind: "structural-summary", total: view.questions.length, correct: view.correct });
    } else {
      setView({ ...view, index: next });
    }
  }, [view]);

  const handleSituationalComplete = useCallback(
    (grade: SituationalGrade) => {
      if (view.kind !== "situational") return;
      recordAttempt({
        rubricId: view.scenarioId,
        mode: "situational",
        key: view.scenarioId,
        ts: Date.now(),
        correct: grade.passed,
      });
      setStatsToken((t) => t + 1);
    },
    [view],
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
      <StructuralCard
        question={view.questions[view.index]!}
        index={view.index}
        total={view.questions.length}
        onAnswer={handleStructuralAnswer}
        onNext={handleStructuralNext}
      />
    );
  }

  if (view.kind === "structural-summary") {
    const pct = Math.round((view.correct / view.total) * 100);
    return (
      <div>
        <div className="summary-eyebrow">— Structural drill —</div>
        <h2 className="summary-heading">
          {view.correct} of {view.total} correct
        </h2>
        <div className="summary-score" aria-label={`Score ${pct} out of 100`}>
          {pct}
          <sup>/100</sup>
        </div>
        <span className="summary-rule" aria-hidden="true" />
        <div className="actions">
          <button type="button" className="btn-secondary" onClick={handleHome}>
            ← Procedures
          </button>
          <button type="button" className="btn-primary btn-grow" onClick={handleStartStructural}>
            Drill again
          </button>
        </div>
      </div>
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
