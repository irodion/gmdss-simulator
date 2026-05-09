import { useEffect, useRef, useState } from "react";
import type { DrillChallenge, DrillResult } from "../drills/drill-types.ts";
import { ResultBadge } from "./ResultBadge.tsx";

interface AbbreviationCardProps {
  readonly challenge: DrillChallenge;
  readonly index: number;
  readonly total: number;
  readonly score: (challenge: DrillChallenge, answer: string) => DrillResult;
  readonly onSubmit: (result: DrillResult) => void;
  readonly onNext: () => void;
  /** When true, MC choices stay neutral after submit and ResultBadge is hidden. */
  readonly suppressFeedback?: boolean;
}

export function AbbreviationCard({
  challenge,
  index,
  total,
  score,
  onSubmit,
  onNext,
  suppressFeedback = false,
}: AbbreviationCardProps) {
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<DrillResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMc = challenge.direction === "abbr-to-expansion";
  const choices = challenge.choices ?? [];

  useEffect(() => {
    setAnswer("");
    setPicked(null);
    setResult(null);
    if (!isMc) inputRef.current?.focus();
  }, [challenge.id, isMc]);

  function submitText() {
    if (result !== null) return;
    if (answer.trim() === "") return;
    const r = score(challenge, answer);
    setResult(r);
    onSubmit(r);
  }

  function submitChoice(choice: string) {
    if (result !== null) return;
    setPicked(choice);
    const r = score(challenge, choice);
    setResult(r);
    onSubmit(r);
  }

  function choiceState(choice: string): "neutral" | "correct" | "wrong" {
    if (result === null || suppressFeedback) return "neutral";
    if (choice === challenge.expectedAnswer) return "correct";
    if (choice === picked) return "wrong";
    return "neutral";
  }

  return (
    <div>
      <div className="progress" aria-live="polite">
        <span>
          Transmission {index + 1} of {total}
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
        <span className="prompt-eyebrow">{isMc ? "expand" : "abbreviate"}</span>
        {challenge.prompt}
      </div>

      {isMc ? (
        <div className="mc-choices" role="group" aria-label="Choose the correct expansion">
          {choices.map((choice) => (
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
      ) : (
        <div className="answer-shell">
          <input
            ref={inputRef}
            type="text"
            className="answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitText();
              }
            }}
            placeholder="Type the abbreviation…"
            disabled={result !== null}
            aria-label="Your answer"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      )}

      {!isMc ? (
        <div className="hint-row">
          <span>
            <span className="kbd">↵</span> to submit
          </span>
          <span>Case-insensitive</span>
        </div>
      ) : null}

      <div className="actions">
        {result === null && !isMc ? (
          <button
            type="button"
            className="btn-primary btn-grow"
            onClick={submitText}
            disabled={answer.trim() === ""}
          >
            Submit
          </button>
        ) : null}
        {result !== null ? (
          <button type="button" className="btn-primary btn-grow" onClick={onNext}>
            {index + 1 < total ? "Next →" : "See results"}
          </button>
        ) : null}
      </div>

      {result !== null && !suppressFeedback ? (
        <ResultBadge result={result} correctAnswer={challenge.expectedAnswer} />
      ) : null}
    </div>
  );
}
