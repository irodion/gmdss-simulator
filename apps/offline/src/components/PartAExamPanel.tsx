import { useEffect, useState } from "react";

import {
  buildRandomMock,
  indexBank,
  loadExamIndex,
  loadItemBank,
  resolveExamItems,
  scoreExam,
} from "../exam/part-a-loader.ts";
import {
  RANDOM_EXAM_ID,
  RANDOM_EXAM_SIZE,
  RANDOM_PASS_THRESHOLD,
  RANDOM_TIME_LIMIT_MINUTES,
  type ExamItem,
  type ExamMeta,
} from "../exam/part-a-types.ts";
import "./part-a-exam.css";

interface Loaded {
  readonly exams: readonly ExamMeta[];
  readonly byId: ReadonlyMap<string, ExamItem>;
  readonly itemCount: number;
}

interface Paper {
  /** Index id (or RANDOM_EXAM_ID) this paper was started from — used by Retake. */
  readonly sourceId: string;
  readonly title: string;
  readonly passThreshold: number;
  readonly timeLimitMinutes: number;
  readonly questions: readonly ExamItem[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PartAExamPanel() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");

  // Active paper (null = on the selection list).
  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([loadExamIndex(), loadItemBank()])
      .then(([index, bank]) => {
        if (!active) return;
        setData({ exams: index.exams, byId: indexBank(bank), itemCount: bank.items.length });
      })
      .catch(() => {
        if (active) setError("Could not load the exam content.");
      });
    return () => {
      active = false;
    };
  }, []);

  const timerActive = paper !== null && !submitted;

  // Tick the countdown once per second while a paper is in progress.
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setTimeLeft((s) => (s > 0 ? s - 1 : s));
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  // Auto-submit when the clock runs out.
  useEffect(() => {
    if (paper && !submitted && timeLeft === 0) setSubmitted(true);
  }, [paper, submitted, timeLeft]);

  function startExam(metaId: string) {
    if (!data) return;
    let next: Paper | null = null;
    if (metaId === RANDOM_EXAM_ID) {
      next = {
        sourceId: RANDOM_EXAM_ID,
        title: "Random mock exam",
        passThreshold: RANDOM_PASS_THRESHOLD,
        timeLimitMinutes: RANDOM_TIME_LIMIT_MINUTES,
        questions: buildRandomMock([...data.byId.values()], RANDOM_EXAM_SIZE),
      };
    } else {
      const meta = data.exams.find((e) => e.id === metaId);
      if (!meta) return;
      next = {
        sourceId: meta.id,
        title: meta.title,
        passThreshold: meta.passThreshold,
        timeLimitMinutes: meta.timeLimitMinutes,
        questions: resolveExamItems(meta.itemIds, data.byId),
      };
    }
    setPaper(next);
    setAnswers({});
    setSubmitted(false);
    setTimeLeft(next.timeLimitMinutes * 60);
  }

  function backToList() {
    setPaper(null);
    setSubmitted(false);
    setTimeLeft(0);
  }

  if (error) {
    return <p className="help">{error}</p>;
  }

  if (!data) {
    return <p className="help">Loading exam bank…</p>;
  }

  // ── Selection list ───────────────────────────────────────────────────────
  if (!paper) {
    return (
      <div className="part-a">
        <p className="part-a-intro">
          Part A written-exam practice — 20 questions, {Math.round(RANDOM_PASS_THRESHOLD * 100)}% to
          pass. Drawn from {data.itemCount} bank questions.
        </p>
        <div className="proc-tiles">
          <button
            type="button"
            className="proc-tile part-a-paper--random"
            onClick={() => startExam(RANDOM_EXAM_ID)}
          >
            <span className="proc-tile-title">🎲 Random mock exam</span>
            <span className="proc-tile-detail">{RANDOM_EXAM_SIZE} questions drawn at random</span>
          </button>
          {data.exams.map((meta) => (
            <button
              key={meta.id}
              type="button"
              className="proc-tile"
              onClick={() => startExam(meta.id)}
            >
              <span className="proc-tile-title">{meta.title}</span>
              <span className="proc-tile-detail">
                {meta.itemIds.length} questions · {Math.round(meta.passThreshold * 100)}% ·{" "}
                {meta.timeLimitMinutes} min
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Taking / reviewing a paper ───────────────────────────────────────────
  const { correct, total, pct } = scoreExam(paper.questions, answers);
  const passed = pct >= paper.passThreshold;
  const unanswered = paper.questions.length - paper.questions.filter((q) => answers[q.id]).length;
  const timeUp = submitted && timeLeft === 0;

  return (
    <div className="part-a">
      <div className="part-a-bar">
        <button type="button" className="part-a-back" onClick={backToList}>
          ‹ Exams
        </button>
        <span className="part-a-title">{paper.title}</span>
        {!submitted && (
          <span className={`part-a-timer${timeLeft <= 60 ? " part-a-timer--low" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        )}
      </div>

      {submitted && (
        <div className="stamp" data-state={passed ? "correct" : "wrong"} role="status">
          <span className="stamp-mark" aria-hidden="true">
            {passed ? "✓" : "✗"}
          </span>
          <div className="stamp-meta">
            <span className="stamp-meta-key">
              {passed ? "PASS" : "FAIL"} — {correct}/{total} ({Math.round(pct * 100)}%)
            </span>
            {timeUp && <span>Time is up — your answers were submitted automatically.</span>}
          </div>
        </div>
      )}

      <ol className="part-a-questions">
        {paper.questions.map((q, i) => {
          const picked = answers[q.id];
          return (
            <li key={q.id} className="part-a-q">
              <div className="prompt">
                <span className="prompt-eyebrow">
                  {i + 1} / {paper.questions.length} · {q.topic}
                  {q.flagged ? " · (*)" : ""}
                </span>
                {q.prompt}
              </div>
              <div className="mc-choices" role="group" aria-label={`Question ${i + 1}`}>
                {q.options.map((o) => {
                  let state: "neutral" | "correct" | "wrong" = "neutral";
                  if (submitted && o.key === q.answer) state = "correct";
                  else if (submitted && picked === o.key) state = "wrong";
                  return (
                    <button
                      key={o.key}
                      type="button"
                      className="mc-choice part-a-choice"
                      data-state={state}
                      aria-pressed={picked === o.key}
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.key }))}
                    >
                      <b>{o.key}.</b> {o.text}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="theory-explanation">
                  <strong>Answer {q.answer}:</strong> {q.explanation}
                  {q.note ? <span className="part-a-note"> {q.note}</span> : null}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="actions">
        {!submitted ? (
          <button type="button" className="btn-primary btn-grow" onClick={() => setSubmitted(true)}>
            Submit &amp; score{unanswered > 0 ? ` (${unanswered} blank)` : ""}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary btn-grow"
            onClick={() => startExam(paper.sourceId)}
          >
            Retake
          </button>
        )}
      </div>
    </div>
  );
}
