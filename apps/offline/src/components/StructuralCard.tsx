import { useEffect, useState } from "react";
import type { MCQuestion } from "../drills/scripts/types.ts";

interface StructuralCardProps {
  readonly question: MCQuestion;
  readonly index: number;
  readonly total: number;
  readonly onAnswer: (correct: boolean) => void;
  readonly onNext: () => void;
}

export function StructuralCard({ question, index, total, onAnswer, onNext }: StructuralCardProps) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [question.id]);

  const locked = picked !== null;

  function handlePick(i: number) {
    if (locked) return;
    setPicked(i);
    onAnswer(i === question.correctIndex);
  }

  function stateFor(i: number): "idle" | "correct" | "wrong" | "miss" {
    if (!locked) return "idle";
    if (i === question.correctIndex) return "correct";
    if (i === picked) return "wrong";
    return "miss";
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
        <span className="prompt-eyebrow">{question.callLabel}</span>
        {question.prompt}
      </div>

      <div className="mc-options" role="radiogroup" aria-label="Answer options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={picked === i}
            className="mc-option"
            data-state={stateFor(i)}
            disabled={locked}
            onClick={() => handlePick(i)}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="actions">
        <button type="button" className="btn-primary btn-grow" onClick={onNext} disabled={!locked}>
          {index + 1 < total ? "Next →" : "See results"}
        </button>
      </div>
    </div>
  );
}
