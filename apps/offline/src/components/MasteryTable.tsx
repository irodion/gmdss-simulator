import { atomUniverse } from "../drills/atom-universe.ts";
import { boxFor, type Box } from "../drills/leitner.ts";
import type { LearningEvent, LearningMode } from "../drills/learning-events.ts";
import { MODE_LABELS } from "./ModeTabs.tsx";

interface MasteryTableProps {
  readonly events: readonly LearningEvent[];
  readonly boxes: ReadonlyMap<string, Box>;
}

interface ModeRow {
  readonly mode: LearningMode;
  readonly label: string;
  readonly universe: number;
  readonly mastered: number; // box >= 4
  readonly weak: number; // box 1 or 2
}

const COUNT_DRIVEN_MODES: readonly LearningMode[] = [
  "phonetic",
  "reverse",
  "number-pronunciation",
  "abbreviation",
  "channel",
];

function rowFor(mode: LearningMode, boxes: ReadonlyMap<string, Box>): ModeRow {
  const universe = atomUniverse(mode);
  let mastered = 0;
  let weak = 0;
  for (const atomId of universe) {
    const box = boxFor(boxes, atomId);
    if (box >= 4) mastered += 1;
    else if (box === 1 || box === 2) weak += 1;
  }
  return { mode, label: MODE_LABELS[mode], universe: universe.length, mastered, weak };
}

interface ProcedureRow {
  readonly rubricId: string;
  readonly attempts: number;
  readonly correctDimensions: number;
}

function procedureRows(events: readonly LearningEvent[]): readonly ProcedureRow[] {
  const byRubric = new Map<string, { attempts: Set<string>; correctDimensions: number }>();
  for (const ev of events) {
    if (ev.mode !== "procedures") continue;
    const rubricId = ev.meta?.rubricId;
    const attemptId = ev.meta?.attemptId;
    if (!rubricId) continue;
    let entry = byRubric.get(rubricId);
    if (!entry) {
      entry = { attempts: new Set<string>(), correctDimensions: 0 };
      byRubric.set(rubricId, entry);
    }
    if (attemptId) entry.attempts.add(attemptId);
    if (ev.correct) entry.correctDimensions += 1;
  }
  return [...byRubric.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rubricId, e]) => ({
      rubricId,
      attempts: e.attempts.size,
      correctDimensions: e.correctDimensions,
    }));
}

export function MasteryTable({ events, boxes }: MasteryTableProps) {
  const countRows = COUNT_DRIVEN_MODES.map((m) => rowFor(m, boxes));
  const procRows = procedureRows(events);

  return (
    <div className="mastery">
      <table className="mastery-table">
        <thead>
          <tr>
            <th>Mode</th>
            <th>Atoms</th>
            <th>Mastered</th>
            <th>Weak</th>
          </tr>
        </thead>
        <tbody>
          {countRows.map((row) => (
            <tr key={row.mode}>
              <td>{row.label}</td>
              <td>{row.universe}</td>
              <td>
                {row.mastered} / {row.universe}
              </td>
              <td>{row.weak}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mastery-procedures">
        <div className="section-eyebrow">Procedures by rubric</div>
        {procRows.length === 0 ? (
          <p className="help">No procedure attempts yet.</p>
        ) : (
          <ul className="mastery-rubric-list">
            {procRows.map((r) => (
              <li key={r.rubricId}>
                <code>{r.rubricId}</code>
                <span>
                  {r.attempts} attempts · {r.correctDimensions} correct dims
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
