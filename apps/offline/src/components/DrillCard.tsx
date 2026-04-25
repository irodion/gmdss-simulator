import { useEffect, useRef, useState } from "react";
import type { DrillChallenge, DrillResult } from "../drills/drill-types.ts";
import { isSupported, speak, speakSequence } from "../lib/tts.ts";
import { ResultBadge } from "./ResultBadge.tsx";

interface DrillCardProps {
  readonly challenge: DrillChallenge;
  readonly index: number;
  readonly total: number;
  readonly score: (challenge: DrillChallenge, answer: string) => DrillResult;
  readonly onSubmit: (result: DrillResult) => void;
  readonly onNext: () => void;
}

export function DrillCard({ challenge, index, total, score, onSubmit, onNext }: DrillCardProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DrillResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ttsAvailable = isSupported();

  useEffect(() => {
    setAnswer("");
    setResult(null);
    inputRef.current?.focus();
  }, [challenge.id]);

  function handleSubmit() {
    const r = score(challenge, answer);
    setResult(r);
    onSubmit(r);
  }

  async function handlePlay() {
    if (challenge.spoken) {
      await speakSequence(challenge.spoken.split(" "), 200);
    } else {
      await speak(challenge.expectedAnswer);
    }
  }

  const isReverse = challenge.type === "reverse";
  const promptEyebrow = isReverse ? "transmission" : "spell";

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
        <span className="prompt-eyebrow">{promptEyebrow}</span>
        {isReverse ? <span className="prompt-listen">Listen and type</span> : challenge.prompt}
      </div>

      {isReverse && ttsAvailable ? (
        <div className="actions actions-spaced">
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePlay}
            disabled={result !== null}
          >
            ▶ Play prompt
          </button>
        </div>
      ) : null}

      <textarea
        ref={inputRef}
        className="answer-input"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          // Disabled textarea doesn't fire keydown; only the unsubmitted state reaches here.
          if (e.key === "Enter" && (isReverse || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={isReverse ? "Type the letters/digits…" : "Type the maritime spelling…"}
        disabled={result !== null}
        aria-label="Your answer"
      />

      <div className="hint-row">
        {isReverse ? (
          <span>
            <span className="kbd">↵</span> to submit
          </span>
        ) : (
          <span>
            <span className="kbd">⌘</span>
            <span className="kbd">↵</span> to submit
          </span>
        )}
        <span>Both ALFA and ALPHA accepted</span>
      </div>

      <div className="actions">
        {result === null ? (
          <button
            type="button"
            className="btn-primary btn-grow"
            onClick={handleSubmit}
            disabled={answer.trim() === ""}
          >
            Submit
          </button>
        ) : (
          <>
            {ttsAvailable ? (
              <button type="button" className="btn-secondary" onClick={handlePlay}>
                🔊 Hear correct
              </button>
            ) : null}
            <button type="button" className="btn-primary btn-grow" onClick={onNext}>
              {index + 1 < total ? "Next →" : "See results"}
            </button>
          </>
        )}
      </div>

      {result !== null ? (
        <ResultBadge
          result={result}
          correctAnswer={isReverse ? (challenge.spoken ?? "") : challenge.expectedAnswer}
        />
      ) : null}
    </div>
  );
}
