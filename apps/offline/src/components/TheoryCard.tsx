import { useEffect, useState } from "react";
import { scoreTheory, type TheoryResult } from "../drills/theory-mode.ts";
import type { TheoryQuestion } from "../drills/theory.ts";

interface TheoryCardProps {
  readonly question: TheoryQuestion;
  /** The four options to show — built once per session by the panel so they stay stable. */
  readonly options: readonly string[];
  readonly index: number;
  readonly total: number;
  readonly onSubmit: (result: TheoryResult) => void;
  readonly onNext: () => void;
}

export function TheoryCard({ question, options, index, total, onSubmit, onNext }: TheoryCardProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<TheoryResult | null>(null);

  useEffect(() => {
    setPicked(null);
    setResult(null);
  }, [question.id]);

  function submitChoice(choice: string) {
    if (result !== null) return;
    setPicked(choice);
    const r = scoreTheory(question, options, choice);
    setResult(r);
    onSubmit(r);
  }

  function choiceState(choice: string): "neutral" | "correct" | "wrong" {
    if (result === null) return "neutral";
    if (choice === question.correctAnswer) return "correct";
    if (choice === picked) return "wrong";
    return "neutral";
  }

  return (
    <div>
      <div className="progress" aria-live="polite">
        <span>
          Question {index + 1} of {total}
        </span>
        <span className="progress-dots" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => {
            const state = i < index ? "done" : i === index ? "active" : "pending";
            const cls = state === "pending" ? "progress-dot" : `progress-dot ${state}`;
            return <span key={i} className={cls} />;
          })}
        </span>
      </div>

      <div className="prompt">
        <span className="prompt-eyebrow">{question.topic}</span>
        {question.prompt}
      </div>

      <div className="mc-choices" role="group" aria-label="Choose the correct answer">
        {options.map((choice) => (
          <button
            key={choice}
            type="button"
            className="mc-choice"
            data-state={choiceState(choice)}
            onClick={() => submitChoice(choice)}
            disabled={result !== null}
            aria-pressed={picked === choice}
          >
            {choice}
          </button>
        ))}
      </div>

      <div className="actions">
        {result !== null ? (
          <button type="button" className="btn-primary btn-grow" onClick={onNext}>
            {index + 1 < total ? "Next →" : "See results"}
          </button>
        ) : null}
      </div>

      {result !== null ? (
        <>
          <div className="stamp" data-state={result.correct ? "correct" : "wrong"} role="status">
            <span className="stamp-mark" aria-hidden="true">
              {result.correct ? "✓" : "✗"}
            </span>
            <div className="stamp-meta">
              <span className="stamp-meta-key">{question.correctAnswer}</span>
              <span>
                {result.correct ? "Logged. Move on when ready." : "The correct answer is above."}
              </span>
            </div>
          </div>
          {question.explanation ? (
            <p className="theory-explanation">{question.explanation}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
