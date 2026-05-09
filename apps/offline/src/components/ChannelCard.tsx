import { useEffect, useState } from "react";
import type { DrillChallenge, DrillResult } from "../drills/drill-types.ts";
import { ResultBadge } from "./ResultBadge.tsx";

interface ChannelCardProps {
  readonly challenge: DrillChallenge;
  readonly index: number;
  readonly total: number;
  readonly score: (challenge: DrillChallenge, answer: string) => DrillResult;
  readonly onSubmit: (result: DrillResult) => void;
  readonly onNext: () => void;
  /** When true, MC choices stay neutral after submit and ResultBadge is hidden. */
  readonly suppressFeedback?: boolean;
}

export function ChannelCard({
  challenge,
  index,
  total,
  score,
  onSubmit,
  onNext,
  suppressFeedback = false,
}: ChannelCardProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<DrillResult | null>(null);

  const choices = challenge.choices ?? [];
  const eyebrow =
    challenge.channelDirection === "channel-to-usage" ? "channel → usage" : "usage → channel";

  useEffect(() => {
    setPicked(null);
    setResult(null);
  }, [challenge.id]);

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
        <span className="prompt-eyebrow">{eyebrow}</span>
        {challenge.prompt}
      </div>

      <div className="mc-choices" role="group" aria-label="Choose the correct answer">
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

      <div className="actions">
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
