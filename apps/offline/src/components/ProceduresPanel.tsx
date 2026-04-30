import { useCallback, useEffect, useState } from "react";
import { loadScriptDrillContent } from "../drills/scripts/content-loader.ts";
import { materializeStructural } from "../drills/scripts/materialize.ts";
import { recordAttempt } from "../drills/scripts/stats.ts";
import type {
  ScriptDrillContent,
  SequenceGrade,
  SequenceTemplate,
} from "../drills/scripts/types.ts";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { SequenceCard } from "./SequenceCard.tsx";

type View = { kind: "home" } | { kind: "structural"; template: SequenceTemplate; round: number };

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

  const handleHome = useCallback(() => {
    setView({ kind: "home" });
  }, []);

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

  return (
    <ProceduresHome
      content={content}
      statsToken={statsToken}
      onStartStructural={handleStartStructural}
    />
  );
}
