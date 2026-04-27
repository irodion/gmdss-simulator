import { useState } from "react";
import { gradeSequence } from "../drills/scripts/materialize.ts";
import type {
  SequenceGrade,
  SequenceItem,
  SequenceTemplate,
  SequenceTemplatePart,
} from "../drills/scripts/types.ts";

interface SequenceCardProps {
  readonly template: SequenceTemplate;
  readonly onComplete: (grade: SequenceGrade) => void;
  readonly onRestart: () => void;
  readonly onBack: () => void;
}

interface PartState {
  readonly part: SequenceTemplatePart;
  readonly pool: SequenceItem[];
  readonly placements: (SequenceItem | null)[];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function initParts(template: SequenceTemplate): PartState[] {
  return template.parts.map((part) => ({
    part,
    pool: shuffle(part.items),
    placements: Array(part.items.length).fill(null),
  }));
}

export function SequenceCard({ template, onComplete, onRestart, onBack }: SequenceCardProps) {
  const [parts, setParts] = useState<PartState[]>(() => initParts(template));
  const [grade, setGrade] = useState<SequenceGrade | null>(null);

  const ready = parts.every((p) => p.placements.every((slot) => slot !== null));

  function updatePart(partId: string, updater: (state: PartState) => PartState) {
    setParts((prev) => prev.map((p) => (p.part.id === partId ? updater(p) : p)));
  }

  function handlePoolPick(partId: string, item: SequenceItem) {
    if (grade !== null) return;
    updatePart(partId, (state) => {
      const nextEmpty = state.placements.findIndex((p) => p === null);
      if (nextEmpty === -1) return state;
      const placements = [...state.placements];
      placements[nextEmpty] = item;
      return {
        ...state,
        placements,
        pool: state.pool.filter((x) => x.id !== item.id),
      };
    });
  }

  function handleSlotReturn(partId: string, slotIndex: number) {
    if (grade !== null) return;
    updatePart(partId, (state) => {
      const item = state.placements[slotIndex];
      if (!item) return state;
      const placements = [...state.placements];
      placements[slotIndex] = null;
      return {
        ...state,
        placements,
        pool: [...state.pool, item],
      };
    });
  }

  function handleSubmit() {
    if (!ready || grade !== null) return;
    const placementsByPart = new Map<string, SequenceItem[]>(
      parts.map((p) => [p.part.id, p.placements as SequenceItem[]]),
    );
    const result = gradeSequence(template, placementsByPart);
    setGrade(result);
    onComplete(result);
  }

  function slotState(
    partId: string,
    slotIndex: number,
    placed: SequenceItem | null,
  ): "empty" | "filled" | "correct" | "wrong" {
    if (grade) {
      const partGrade = grade.parts.find((p) => p.partId === partId);
      const cell = partGrade?.placements[slotIndex];
      return cell?.correct ? "correct" : "wrong";
    }
    return placed === null ? "empty" : "filled";
  }

  return (
    <div>
      <div className="prompt">
        <span className="prompt-eyebrow">{template.callLabel}</span>
        Place each element in the correct order
      </div>

      {parts.map((state) => {
        const partGrade = grade?.parts.find((p) => p.partId === state.part.id);
        return (
          <section key={state.part.id} className="seq-part">
            <h3 className="seq-part-header">{state.part.label}</h3>
            <ol className="seq-slots">
              {state.placements.map((placed, i) => {
                const status = slotState(state.part.id, i, placed);
                const expected = partGrade?.placements[i]?.expected ?? null;
                return (
                  <li key={i} className="seq-slot" data-state={status}>
                    <button
                      type="button"
                      className="seq-slot-btn"
                      onClick={() => handleSlotReturn(state.part.id, i)}
                      disabled={placed === null || grade !== null}
                      aria-label={
                        placed === null
                          ? `${state.part.label} slot ${i + 1}, empty`
                          : `${state.part.label} slot ${i + 1}, ${placed.label}`
                      }
                    >
                      <span className="seq-slot-num" aria-hidden="true">
                        {i + 1}.
                      </span>
                      <span className="seq-slot-content">
                        {placed === null ? (
                          <em className="seq-slot-placeholder">—</em>
                        ) : (
                          placed.label
                        )}
                      </span>
                    </button>
                    {status === "wrong" && expected ? (
                      <div className="seq-slot-expected">should be: {expected.label}</div>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <div className="seq-pool" aria-label={`${state.part.label} pool`}>
              {state.pool.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="seq-pool-item"
                  onClick={() => handlePoolPick(state.part.id, item)}
                  disabled={grade !== null}
                >
                  {item.label}
                </button>
              ))}
              {state.pool.length === 0 && grade === null ? (
                <p className="seq-pool-empty">All elements placed.</p>
              ) : null}
            </div>
          </section>
        );
      })}

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
