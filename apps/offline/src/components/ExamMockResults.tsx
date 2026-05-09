import type { ExamMockSummary } from "../drills/exam-mock.ts";
import { MODE_LABELS } from "./ModeTabs.tsx";

interface ExamMockResultsProps {
  readonly summary: ExamMockSummary;
  readonly onClose: () => void;
}

export function ExamMockResults({ summary, onClose }: ExamMockResultsProps) {
  const { perMode, correct, total, pct, passed } = summary;
  return (
    <div className="exam-results">
      <div className="summary-eyebrow">— Exam Mock complete —</div>
      <h2 className="summary-heading">
        {correct} of {total} answered perfectly
      </h2>
      <div className="summary-score" aria-label={`${pct} percent`}>
        {pct}
        <sup>%</sup>
      </div>
      <p className="summary-detail" data-state={passed ? "pass" : "fail"}>
        {passed ? "Likely exam-ready" : "Keep drilling"}
      </p>
      <table className="exam-breakdown" aria-label="Per-mode score">
        <tbody>
          {perMode.map((row) => (
            <tr key={row.mode}>
              <th scope="row">{MODE_LABELS[row.mode]}</th>
              <td>
                {row.correct} / {row.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn-primary btn-block" onClick={onClose}>
        Begin a new watch
      </button>
    </div>
  );
}
