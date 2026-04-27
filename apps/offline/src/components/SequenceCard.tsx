import { useState } from "react";
import { gradeSequence } from "../drills/scripts/materialize.ts";
import type { SequenceGrade, SequenceItem, SequenceTemplate } from "../drills/scripts/types.ts";

interface SequenceCardProps {
  readonly template: SequenceTemplate;
  readonly onComplete: (grade: SequenceGrade) => void;
  readonly onRestart: () => void;
  readonly onBack: () => void;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function SequenceCard({ template, onComplete, onRestart, onBack }: SequenceCardProps) {
  const total = template.correctOrder.length;
  const [pool, setPool] = useState<SequenceItem[]>(() => shuffle(template.correctOrder));
  const [placements, setPlacements] = useState<(SequenceItem | null)[]>(() =>
    Array(total).fill(null),
  );
  const [grade, setGrade] = useState<SequenceGrade | null>(null);

  const filledCount = placements.filter((p) => p !== null).length;
  const ready = filledCount === total;

  function handlePoolPick(item: SequenceItem) {
    if (grade !== null) return;
    const nextEmpty = placements.findIndex((p) => p === null);
    if (nextEmpty === -1) return;
    const next = [...placements];
    next[nextEmpty] = item;
    setPlacements(next);
    setPool((p) => p.filter((x) => x.id !== item.id));
  }

  function handleSlotReturn(slotIndex: number) {
    if (grade !== null) return;
    const item = placements[slotIndex];
    if (!item) return;
    const next = [...placements];
    next[slotIndex] = null;
    setPlacements(next);
    setPool((p) => [...p, item]);
  }

  function handleSubmit() {
    if (!ready || grade !== null) return;
    const result = gradeSequence(template, placements as SequenceItem[]);
    setGrade(result);
    onComplete(result);
  }

  function slotState(i: number): "empty" | "filled" | "correct" | "wrong" {
    if (grade) {
      return grade.placements[i]!.correct ? "correct" : "wrong";
    }
    return placements[i] === null ? "empty" : "filled";
  }

  return (
    <div>
      <div className="prompt">
        <span className="prompt-eyebrow">{template.callLabel}</span>
        Place each element in the correct order
      </div>

      <div className="seq-stage">
        <ol className="seq-slots">
          {placements.map((placed, i) => {
            const state = slotState(i);
            const expected = grade ? grade.placements[i]!.expected : null;
            return (
              <li key={i} className="seq-slot" data-state={state}>
                <button
                  type="button"
                  className="seq-slot-btn"
                  onClick={() => handleSlotReturn(i)}
                  disabled={placed === null || grade !== null}
                  aria-label={
                    placed === null ? `Slot ${i + 1}, empty` : `Slot ${i + 1}, ${placed.label}`
                  }
                >
                  <span className="seq-slot-num" aria-hidden="true">
                    {i + 1}.
                  </span>
                  <span className="seq-slot-content">
                    {placed === null ? <em className="seq-slot-placeholder">—</em> : placed.label}
                  </span>
                </button>
                {state === "wrong" && expected ? (
                  <div className="seq-slot-expected">should be: {expected.label}</div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="seq-pool" aria-label="Pool of phrases">
          {pool.map((item) => (
            <button
              key={item.id}
              type="button"
              className="seq-pool-item"
              onClick={() => handlePoolPick(item)}
              disabled={grade !== null}
            >
              {item.label}
            </button>
          ))}
          {pool.length === 0 && grade === null ? (
            <p className="seq-pool-empty">All elements placed — review and Submit.</p>
          ) : null}
        </div>
      </div>

      <div className="actions">
        {grade === null ? (
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>
              ← Procedures
            </button>
            <button
              type="button"
              className="btn-primary btn-grow"
              onClick={handleSubmit}
              disabled={!ready}
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>
              ← Procedures
            </button>
            <button type="button" className="btn-primary btn-grow" onClick={onRestart}>
              {grade.passed ? "Drill again" : "Try again"}
            </button>
          </>
        )}
      </div>

      {grade !== null ? (
        <div
          className="seq-summary"
          data-state={grade.passed ? "pass" : "partial"}
          aria-live="polite"
        >
          <span className="seq-summary-score">
            {grade.correctCount}
            <small> / {grade.total}</small>
          </span>
          <span className="seq-summary-label">
            {grade.passed ? "perfect order" : "review the misplaced fields"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
