import type { RubricDefinition } from "@gmdss-simulator/utils";
import { useState } from "react";
import { gradeAgainst } from "../drills/scripts/grade.ts";
import type { SituationalGrade, SituationalPrompt } from "../drills/scripts/types.ts";
import { GradeBreakdown } from "./GradeBreakdown.tsx";

interface SituationalCardProps {
  readonly prompt: SituationalPrompt;
  readonly rubric: RubricDefinition;
  readonly onComplete: (grade: SituationalGrade) => void;
  readonly onRestart: () => void;
  readonly onBack: () => void;
}

export function SituationalCard({
  prompt,
  rubric,
  onComplete,
  onRestart,
  onBack,
}: SituationalCardProps) {
  const [text, setText] = useState("");
  const [grade, setGrade] = useState<SituationalGrade | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  function handleSubmit() {
    if (text.trim() === "") return;
    const result = gradeAgainst(prompt, rubric, text);
    setGrade(result);
    if (!revealed) onComplete(result);
  }

  function handleRestart() {
    setText("");
    setGrade(null);
    setRevealed(false);
    setHintsOpen(false);
    onRestart();
  }

  const vesselLine = [
    `${prompt.vessel.name}`,
    prompt.vessel.callsign ? `Callsign ${prompt.vessel.callsign}` : null,
    prompt.vessel.mmsi ? `MMSI ${prompt.vessel.mmsi}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div className="prompt">
        <span className="prompt-eyebrow">Situational · {prompt.scenarioId}</span>
        {prompt.title}
      </div>

      <div className="scenario-brief">
        <p className="scenario-brief-line">{vesselLine}</p>
        {prompt.vessel.position ? (
          <p className="scenario-brief-line">Position: {prompt.vessel.position}</p>
        ) : null}
        {prompt.vessel.personsOnBoard != null ? (
          <p className="scenario-brief-line">{prompt.vessel.personsOnBoard} persons on board</p>
        ) : null}
        <p className="scenario-brief-line">Channel {prompt.requiredChannel}</p>
        <p className="scenario-brief-task">{prompt.task}</p>
      </div>

      {prompt.hints.length > 0 ? (
        <details
          className="scenario-hints"
          open={hintsOpen}
          onToggle={(e) => setHintsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>Hints ({prompt.hints.length})</summary>
          <ol className="scenario-hints-list">
            {prompt.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </details>
      ) : null}

      <textarea
        className="answer-input answer-input-tall"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type the full voice call as you would speak it…"
        disabled={grade !== null}
        aria-label="Your transmission"
      />

      <div className="hint-row">
        <span>
          <span className="kbd">⌘</span>
          <span className="kbd">↵</span> to submit
        </span>
        {revealed ? <span className="reveal-warn">attempt won't be recorded</span> : null}
      </div>

      <div className="actions">
        {grade === null ? (
          <>
            <button type="button" className="btn-secondary" onClick={() => setRevealed((v) => !v)}>
              {revealed ? "Hide canonical" : "Reveal canonical"}
            </button>
            <button
              type="button"
              className="btn-primary btn-grow"
              onClick={handleSubmit}
              disabled={text.trim() === ""}
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>
              ← Back
            </button>
            <button type="button" className="btn-primary btn-grow" onClick={handleRestart}>
              Try again
            </button>
          </>
        )}
      </div>

      {revealed && grade === null ? (
        <pre className="canonical-reveal" aria-label="Canonical script">
          {prompt.canonical}
        </pre>
      ) : null}

      {grade !== null ? <GradeBreakdown breakdown={grade.breakdown} /> : null}
    </div>
  );
}
