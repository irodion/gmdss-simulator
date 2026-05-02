import { useEffect, useRef, useState } from "react";
import { gradeScenario } from "../drills/scripts/grade.ts";
import {
  type DimensionStatus,
  isPriorityItem,
  isProcedureItem,
  type Scenario,
  type SequenceGrade,
  type SequenceItem,
  type SequenceScoreDimension,
  type SequenceTemplate,
  type SequenceTemplatePart,
} from "../drills/scripts/types.ts";

interface SequenceCardProps {
  readonly template: SequenceTemplate;
  readonly scenario: Scenario;
  readonly onComplete: (grade: SequenceGrade) => void;
  readonly onRetry: () => void;
  readonly onNewScenario: () => void;
  readonly onBack: () => void;
}

interface PartState {
  readonly part: SequenceTemplatePart;
  readonly placements: (SequenceItem | null)[];
}

const STATUS_ICONS: Readonly<Record<DimensionStatus, string>> = {
  pass: "✓",
  partial: "◐",
  fail: "✗",
};

function initParts(template: SequenceTemplate): PartState[] {
  return template.parts.map((part) => ({
    part,
    placements: Array(part.items.length).fill(null),
  }));
}

export function SequenceCard({
  template,
  scenario,
  onComplete,
  onRetry,
  onNewScenario,
  onBack,
}: SequenceCardProps) {
  const [parts, setParts] = useState<PartState[]>(() => initParts(template));
  const [pool, setPool] = useState<readonly SequenceItem[]>(() => template.pool);
  const [grade, setGrade] = useState<SequenceGrade | null>(null);
  const scenarioRef = useRef<HTMLElement | null>(null);

  // Scroll the scenario brief into view whenever the scenario changes (e.g. "New
  // scenario" after a long-scrolled feedback view), so the student starts at the top.
  useEffect(() => {
    scenarioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scenario.id]);

  const ready = parts.every((p) => p.placements.every((slot) => slot !== null));
  const showPartHeader = template.parts.length > 1;

  function updatePart(partId: string, updater: (state: PartState) => PartState) {
    setParts((prev) => prev.map((p) => (p.part.id === partId ? updater(p) : p)));
  }

  function handlePoolPick(poolIndex: number) {
    if (grade !== null) return;
    const item = pool[poolIndex];
    if (!item) return;
    const targetPart = parts.find((p) => p.placements.some((slot) => slot === null));
    if (!targetPart) return;
    updatePart(targetPart.part.id, (state) => {
      const nextEmpty = state.placements.findIndex((slot) => slot === null);
      if (nextEmpty === -1) return state;
      const placements = [...state.placements];
      placements[nextEmpty] = item;
      return { ...state, placements };
    });
    setPool((prev) => prev.filter((_, i) => i !== poolIndex));
  }

  function handleSlotReturn(partId: string, slotIndex: number) {
    if (grade !== null) return;
    const part = parts.find((p) => p.part.id === partId);
    const item = part?.placements[slotIndex];
    if (!item) return;
    updatePart(partId, (state) => {
      const placements = [...state.placements];
      placements[slotIndex] = null;
      return { ...state, placements };
    });
    setPool((prev) => [...prev, item]);
  }

  function handleSubmit() {
    if (!ready || grade !== null) return;
    const placementsByPart = new Map<string, SequenceItem[]>(
      parts.map((p) => [p.part.id, p.placements as SequenceItem[]]),
    );
    const result = gradeScenario(template, placementsByPart);
    setGrade(result);
    onComplete(result);
  }

  function slotState(
    partId: string,
    slotIndex: number,
    placed: SequenceItem | null,
  ): "empty" | "filled" | "correct" | "wrong" {
    if (!grade) return placed === null ? "empty" : "filled";
    const cell = grade.parts.find((p) => p.partId === partId)?.placements[slotIndex];
    return cell?.correct ? "correct" : "wrong";
  }

  const indexedPool = pool.map((item, idx) => ({ item, idx }));
  const priorityPool = indexedPool.filter(({ item }) => isPriorityItem(item.id));
  const procedurePool = indexedPool.filter(
    ({ item }) => !isPriorityItem(item.id) && isProcedureItem(item.id),
  );
  const contentPool = indexedPool.filter(
    ({ item }) => !isPriorityItem(item.id) && !isProcedureItem(item.id),
  );

  return (
    <div>
      <section ref={scenarioRef} className="scenario-card" aria-label="Scenario">
        <span className="scenario-eyebrow">Scenario</span>
        <p className="scenario-brief">{scenario.brief}</p>
      </section>

      <div className="prompt">
        <span className="prompt-eyebrow">{template.callLabel}</span>
        Pick the right priority and order the phrases for this scenario
      </div>

      {parts.map((state) => {
        const partGrade = grade?.parts.find((p) => p.partId === state.part.id);
        return (
          <section key={state.part.id} className="seq-part">
            {showPartHeader ? <h3 className="seq-part-header">{state.part.label}</h3> : null}
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
          </section>
        );
      })}

      <div className="seq-pool-groups" aria-label="Phrase pool">
        {priorityPool.length > 0 ? (
          <div className="seq-pool seq-pool-priority" aria-label="Priority openings">
            {priorityPool.map(({ item, idx }) => (
              <button
                key={`p-${idx}`}
                type="button"
                className="seq-pool-item seq-pool-item-priority"
                onClick={() => handlePoolPick(idx)}
                disabled={grade !== null}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {procedurePool.length > 0 ? (
          <div className="seq-pool seq-pool-procedure" aria-label="Procedure actions">
            {procedurePool.map(({ item, idx }) => (
              <button
                key={`r-${idx}`}
                type="button"
                className="seq-pool-item seq-pool-item-procedure"
                onClick={() => handlePoolPick(idx)}
                disabled={grade !== null}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {contentPool.length > 0 ? (
          <div className="seq-pool" aria-label="Phrase chips">
            {contentPool.map(({ item, idx }) => (
              <button
                key={`c-${idx}`}
                type="button"
                className="seq-pool-item"
                onClick={() => handlePoolPick(idx)}
                disabled={grade !== null}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {pool.length === 0 && grade === null ? (
          <p className="seq-pool-empty">All elements placed.</p>
        ) : null}
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
            <button type="button" className="btn-secondary" onClick={onRetry}>
              Try again
            </button>
            <button type="button" className="btn-primary btn-grow" onClick={onNewScenario}>
              New scenario
            </button>
          </>
        )}
      </div>

      {grade !== null ? <SequenceBreakdown grade={grade} /> : null}
    </div>
  );
}

interface SequenceBreakdownProps {
  readonly grade: SequenceGrade;
}

function SequenceBreakdown({ grade }: SequenceBreakdownProps) {
  return (
    <div className="seq-summary" data-state={grade.passed ? "pass" : "partial"} aria-live="polite">
      <div className="seq-summary-header">
        <span className="seq-summary-score">
          {grade.correctCount}
          <small> / {grade.total}</small>
        </span>
        <span className="seq-summary-label">
          {grade.passed ? "perfect call" : "review the misplaced fields"}
        </span>
      </div>
      <ul className="seq-breakdown" aria-label="Score breakdown by dimension">
        {grade.dimensions.map((d) => (
          <DimensionRow key={d.id} dimension={d} />
        ))}
      </ul>
    </div>
  );
}

function DimensionRow({ dimension }: { readonly dimension: SequenceScoreDimension }) {
  return (
    <li className="seq-breakdown-row" data-status={dimension.status}>
      <span className="seq-breakdown-label">{dimension.label}</span>
      <span className="seq-breakdown-score">
        {dimension.correct} / {dimension.total}
      </span>
      <span className="seq-breakdown-status" aria-label={dimension.status}>
        {STATUS_ICONS[dimension.status]}
      </span>
    </li>
  );
}
