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
  readonly placements: SequenceItem[];
}

const STATUS_ICONS: Readonly<Record<DimensionStatus, string>> = {
  pass: "✓",
  partial: "◐",
  fail: "✗",
};

function initParts(template: SequenceTemplate): PartState[] {
  return template.parts.map((part) => ({
    part,
    placements: [],
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
  const [activePartId, setActivePartId] = useState<string>(() => template.parts[0]?.id ?? "");
  const scenarioRef = useRef<HTMLElement | null>(null);

  // Scroll the scenario brief into view whenever the scenario changes (e.g. "New
  // scenario" after a long-scrolled feedback view), so the student starts at the top.
  useEffect(() => {
    scenarioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scenario.id]);

  const showPartHeader = template.parts.length > 1;
  const totalPlaced = parts.reduce((sum, p) => sum + p.placements.length, 0);

  function updatePart(partId: string, updater: (state: PartState) => PartState) {
    setParts((prev) => prev.map((p) => (p.part.id === partId ? updater(p) : p)));
  }

  function handlePoolPick(poolIndex: number) {
    if (grade !== null) return;
    const item = pool[poolIndex];
    if (!item) return;
    updatePart(activePartId, (state) => ({
      ...state,
      placements: [...state.placements, item],
    }));
    setPool((prev) => prev.filter((_, i) => i !== poolIndex));
  }

  function handleEntryRemove(partId: string, entryIndex: number) {
    if (grade !== null) return;
    const part = parts.find((p) => p.part.id === partId);
    const item = part?.placements[entryIndex];
    if (!item) return;
    updatePart(partId, (state) => ({
      ...state,
      placements: state.placements.filter((_, i) => i !== entryIndex),
    }));
    setPool((prev) => [...prev, item]);
  }

  function handleEntryMove(partId: string, entryIndex: number, direction: -1 | 1) {
    if (grade !== null) return;
    updatePart(partId, (state) => {
      const target = entryIndex + direction;
      if (target < 0 || target >= state.placements.length) return state;
      const next = [...state.placements];
      const [moved] = next.splice(entryIndex, 1);
      if (!moved) return state;
      next.splice(target, 0, moved);
      return { ...state, placements: next };
    });
  }

  function handleSubmit() {
    if (grade !== null) return;
    const placementsByPart = new Map<string, SequenceItem[]>(
      parts.map((p) => [p.part.id, [...p.placements]]),
    );
    const result = gradeScenario(template, placementsByPart);
    setGrade(result);
    onComplete(result);
  }

  const indexedPool = pool.map((item, idx) => ({ item, idx }));
  const priorityPool = indexedPool.filter(({ item }) => isPriorityItem(item.id));
  const procedurePool = indexedPool.filter(
    ({ item }) => !isPriorityItem(item.id) && isProcedureItem(item.id),
  );
  const contentPool = indexedPool.filter(
    ({ item }) => !isPriorityItem(item.id) && !isProcedureItem(item.id),
  );

  const summaryLabel = grade ? (grade.passed ? "passed" : "review the misplaced fields") : "";

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
        const isActive = grade === null && showPartHeader && activePartId === state.part.id;
        const activate = () => {
          if (grade === null && activePartId !== state.part.id) {
            setActivePartId(state.part.id);
          }
        };
        return (
          <section
            key={state.part.id}
            className="seq-part"
            data-active={isActive ? "true" : undefined}
            onPointerDown={activate}
            onFocus={activate}
          >
            {showPartHeader ? (
              <h3 className="seq-part-header">
                <button
                  type="button"
                  className="seq-part-header-btn"
                  onClick={activate}
                  aria-pressed={isActive}
                  aria-label={
                    isActive
                      ? `${state.part.label} (active — pool picks add here)`
                      : `${state.part.label} — make active`
                  }
                >
                  {state.part.label}
                  {isActive ? (
                    <span className="seq-part-active-tag" aria-hidden="true">
                      {" "}
                      · active
                    </span>
                  ) : null}
                </button>
              </h3>
            ) : null}
            <ol className="seq-slots" aria-label={`${state.part.label} entries`}>
              {state.placements.map((placed, i) => {
                const cell = partGrade?.placements[i];
                const status = renderStatus(grade, cell);
                const expected = cell?.expected ?? null;
                const isLast = i === state.placements.length - 1;
                return (
                  <li key={`${state.part.id}-${i}`} className="seq-slot" data-state={status}>
                    <span className="seq-slot-num" aria-hidden="true">
                      {i + 1}.
                    </span>
                    <span className="seq-slot-content">{placed.label}</span>
                    {grade === null ? (
                      <span className="seq-slot-controls">
                        <button
                          type="button"
                          className="seq-slot-move"
                          onClick={() => handleEntryMove(state.part.id, i, -1)}
                          disabled={i === 0}
                          aria-label={`Move ${placed.label} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="seq-slot-move"
                          onClick={() => handleEntryMove(state.part.id, i, 1)}
                          disabled={isLast}
                          aria-label={`Move ${placed.label} down`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="seq-slot-remove"
                          onClick={() => handleEntryRemove(state.part.id, i)}
                          aria-label={`Remove ${placed.label}`}
                        >
                          ×
                        </button>
                      </span>
                    ) : null}
                    {status === "wrong" && expected ? (
                      <div className="seq-slot-expected">should be: {expected.label}</div>
                    ) : null}
                  </li>
                );
              })}
              {grade === null ? (
                <li className="seq-droparea" aria-hidden="true">
                  {state.placements.length === 0
                    ? "Tap a phrase below to add it as the first step"
                    : "Tap another phrase to add it as the next step"}
                </li>
              ) : null}
            </ol>
            {grade !== null && partGrade && partGrade.missing.length > 0 ? (
              <MissingList partLabel={state.part.label} missing={partGrade.missing} />
            ) : null}
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
          <p className="seq-pool-empty">All phrases used.</p>
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
              aria-label={
                totalPlaced === 0
                  ? "Submit (no phrases placed yet)"
                  : `Submit ${totalPlaced} placed phrase${totalPlaced === 1 ? "" : "s"}`
              }
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

      {grade !== null ? <SequenceBreakdown grade={grade} label={summaryLabel} /> : null}
    </div>
  );
}

function renderStatus(
  grade: SequenceGrade | null,
  cell: { correct: boolean } | undefined,
): "filled" | "correct" | "wrong" {
  if (!grade) return "filled";
  return cell?.correct ? "correct" : "wrong";
}

interface MissingListProps {
  readonly partLabel: string;
  readonly missing: readonly SequenceItem[];
}

function MissingList({ partLabel, missing }: MissingListProps) {
  return (
    <div className="seq-missing" aria-label={`${partLabel} missing steps`}>
      <span className="seq-missing-eyebrow">Missed steps</span>
      <ul>
        {missing.map((item, i) => (
          <li key={`${item.id}-${i}`}>
            <span className="seq-missing-mark" aria-hidden="true">
              ⊘
            </span>{" "}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SequenceBreakdownProps {
  readonly grade: SequenceGrade;
  readonly label: string;
}

function SequenceBreakdown({ grade, label }: SequenceBreakdownProps) {
  const percent = Math.round(grade.score * 100);
  return (
    <div className="seq-summary" data-state={grade.passed ? "pass" : "partial"} aria-live="polite">
      <div className="seq-summary-header">
        <span className="seq-summary-score">
          {percent}
          <small>%</small>
        </span>
        <span className="seq-summary-label">{label}</span>
      </div>
      <p className="seq-summary-detail">
        {grade.correctCount} of {grade.total} expected steps matched
        {grade.extraCount > 0 ? `; ${grade.extraCount} extra entries` : ""}.
      </p>
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
