import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch, ApiError } from "../../lib/api-client.ts";
import { addPendingAction } from "../../lib/offline-db.ts";
import "../../styles/pages.css";

interface Question {
  id: string;
  text: string;
  options: { key: string; text: string }[];
}

interface QuizData {
  id: string;
  title: string;
  passThreshold: number;
  questions: Question[];
}

interface QuestionResult {
  questionId: string;
  correct: boolean;
  explanation?: string;
  correctAnswer?: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  threshold: number;
  results: QuestionResult[];
  unlocked: { id: string; title: string }[];
}

export function QuizPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { t } = useTranslation("learning");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<QuizData>(`/api/content/modules/${moduleId}/quiz`);
        setQuiz(data);
      } catch {
        setSubmitError(t("common:error"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [moduleId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setSubmitError("");
    setQueued(false);

    const payload = {
      answers: Object.entries(answers).map(([questionId, selected]) => ({
        questionId,
        selected,
      })),
    };

    const path = `/api/progress/quiz/${quiz.id}/submit`;
    try {
      const data = await apiFetch<QuizResult>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        return;
      }
      await addPendingAction("POST", path, payload);
      setQueued(true);
    }
  }

  if (loading) {
    return (
      <div className="lesson-page">
        <div className="lesson-page__loading">
          <div className="lesson-page__loading-bar" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="lesson-page">
        <div className="alert alert--error">{t("common:error")}</div>
        <Link to={`/learn/${moduleId}`} className="lesson-page__back">
          ← {t("common:back", "Back")}
        </Link>
      </div>
    );
  }

  if (result) {
    const resultsByQuestion = new Map(result.results.map((r) => [r.questionId, r]));

    return (
      <div className="lesson-page">
        <div className="quiz-result">
          <div className="quiz-result__score-section">
            <div
              className={`quiz-result__gauge ${result.passed ? "quiz-result__gauge--pass" : "quiz-result__gauge--fail"}`}
            >
              <svg viewBox="0 0 120 120" className="quiz-result__ring">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  opacity="0.15"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.score / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="quiz-result__score-value">{result.score}%</span>
            </div>
            <div
              className={`quiz-result__verdict ${result.passed ? "quiz-result__verdict--pass" : "quiz-result__verdict--fail"}`}
            >
              {result.passed ? t("passed") : t("failed")}
            </div>
            <div className="quiz-result__threshold">
              {t("passThreshold", { threshold: result.threshold })}
            </div>
          </div>

          {result.passed && result.unlocked.length > 0 && (
            <div className="quiz-result__unlock">
              <span className="quiz-result__unlock-icon">🔓</span>
              <span>
                {t("unlocked")} {result.unlocked.map((m) => m.title).join(", ")}
              </span>
            </div>
          )}

          {quiz.questions.length > 0 && (
            <div className="quiz-result__review">
              <div className="quiz-result__review-title">{t("common:results", "Results")}</div>
              {quiz.questions.map((q, i) => {
                const qr = resultsByQuestion.get(q.id);
                return (
                  <div
                    key={q.id}
                    className={`quiz-result__question ${qr?.correct ? "quiz-result__question--correct" : "quiz-result__question--wrong"}`}
                  >
                    <div className="quiz-result__question-header">
                      <span className="quiz-result__question-number">{i + 1}</span>
                      <span className="quiz-result__question-text">{q.text}</span>
                      <span className="quiz-result__question-icon">{qr?.correct ? "✓" : "✗"}</span>
                    </div>
                    {qr && !qr.correct && qr.explanation && (
                      <div className="quiz-result__explanation">{qr.explanation}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="quiz-result__actions">
            <Link to={`/learn/${moduleId}`} className="btn">
              ← {t("common:back", "Back to module")}
            </Link>
            {!result.passed && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                {t("common:tryAgain", "Try again")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <div className="lesson-page">
      <div className="lesson-page__header">
        <Link to={`/learn/${moduleId}`} className="lesson-page__back">
          <span>←</span> {t("common:back", "Back")}
        </Link>
        <div className="lesson-page__progress-indicator">
          <span className="lesson-page__step">
            {answeredCount}/{totalQuestions}
          </span>
          <div className="lesson-page__progress-track">
            <div
              className="lesson-page__progress-fill"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="lesson-page__title-area">
        <span className="lesson-page__lesson-number">{t("checkpoint")}</span>
        <h2 className="lesson-page__title">{quiz.title}</h2>
        <p className="page-subtitle">{t("passThreshold", { threshold: quiz.passThreshold })}</p>
      </div>

      {submitError && (
        <div className="alert alert--error" role="alert">
          {submitError}
        </div>
      )}
      {queued && (
        <div className="alert alert--info" role="status">
          {t("offlineQueued")}
        </div>
      )}

      <div className="lesson-page__content-card">
        <form onSubmit={(e) => void handleSubmit(e)}>
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="quiz-question">
              <div className="quiz-question__prompt">
                <span className="quiz-question__number">{i + 1}</span>
                {q.text}
              </div>
              <div className="quiz-question__options">
                {q.options.map((opt) => (
                  <label
                    key={opt.key}
                    className={`quiz-question__option${answers[q.id] === opt.key ? " quiz-question__option--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.key}
                      checked={answers[q.id] === opt.key}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                      className="quiz-question__radio"
                    />
                    <span className="quiz-question__option-key">{opt.key.toUpperCase()}</span>
                    <span className="quiz-question__option-text">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="quiz-submit">
            <button
              type="submit"
              className="btn btn--primary quiz-submit__btn"
              disabled={!allAnswered}
            >
              {t("submitQuiz")}
            </button>
            {!allAnswered && (
              <span className="quiz-submit__hint">
                {answeredCount}/{totalQuestions} answered
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
