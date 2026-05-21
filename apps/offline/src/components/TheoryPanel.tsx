import { useCallback, useState } from "react";
import { applySessionAndPersist } from "../drills/daily-progress.ts";
import {
  buildTheoryOptions,
  selectTheoryQuestions,
  type TheoryResult,
} from "../drills/theory-mode.ts";
import type { TheoryQuestion } from "../drills/theory.ts";
import { SessionConfig } from "./SessionConfig.tsx";
import { TheoryCard } from "./TheoryCard.tsx";
import { TheorySummary } from "./TheorySummary.tsx";

/**
 * Internal state machine — Theory owns its own config → question → summary
 * flow rather than threading through App.tsx's `screen` state, mirroring how
 * ProceduresPanel works.
 */
type View =
  | { readonly kind: "config" }
  | {
      readonly kind: "question";
      readonly questions: readonly TheoryQuestion[];
      /** Options built once at session start so they don't reshuffle on re-render. */
      readonly optionsById: ReadonlyMap<string, readonly string[]>;
      readonly index: number;
      readonly results: readonly TheoryResult[];
    }
  | { readonly kind: "summary"; readonly results: readonly TheoryResult[] };

interface TheoryPanelProps {
  /** Called after a completed session so the daily indicator refreshes. */
  readonly onSessionRecorded?: () => void;
}

export function TheoryPanel({ onSessionRecorded }: TheoryPanelProps = {}) {
  const [count, setCount] = useState(5);
  const [view, setView] = useState<View>({ kind: "config" });

  const handleStart = useCallback(() => {
    const questions = selectTheoryQuestions(count);
    if (questions.length === 0) return;
    const optionsById = new Map<string, readonly string[]>(
      questions.map((q) => [q.id, buildTheoryOptions(q)]),
    );
    setView({ kind: "question", questions, optionsById, index: 0, results: [] });
  }, [count]);

  const handleSubmit = useCallback((result: TheoryResult) => {
    setView((prev) =>
      prev.kind === "question" ? { ...prev, results: [...prev.results, result] } : prev,
    );
  }, []);

  const handleNext = useCallback(() => {
    if (view.kind !== "question") return;
    if (view.index + 1 < view.questions.length) {
      setView({ ...view, index: view.index + 1 });
      return;
    }
    // Last question answered — record the session as Free Practice (it does
    // not advance the streak), then move to the summary. Persisting here in
    // the event handler keeps it a once-per-session call.
    applySessionAndPersist({ adaptiveItems: 0, freeItems: view.results.length, now: Date.now() });
    onSessionRecorded?.();
    setView({ kind: "summary", results: view.results });
  }, [view, onSessionRecorded]);

  const handleRestart = useCallback(() => {
    setView({ kind: "config" });
  }, []);

  if (view.kind === "config") {
    return (
      <SessionConfig
        count={count}
        onCountChange={setCount}
        onStart={handleStart}
        cheatsheet={null}
      />
    );
  }

  if (view.kind === "summary") {
    return <TheorySummary results={view.results} onRestart={handleRestart} />;
  }

  const question = view.questions[view.index]!;
  return (
    <TheoryCard
      key={question.id}
      question={question}
      options={view.optionsById.get(question.id) ?? []}
      index={view.index}
      total={view.questions.length}
      onSubmit={handleSubmit}
      onNext={handleNext}
    />
  );
}
