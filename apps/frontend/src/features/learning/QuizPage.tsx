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

interface QuizResult {
  score: number;
  passed: boolean;
  threshold: number;
  results: { questionId: string; correct: boolean; explanation?: string }[];
  unlocked: string[];
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
        // handle error
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
      // Network failure — queue for offline replay
      await addPendingAction("POST", path, payload);
      setQueued(true);
    }
  }

  if (loading) return <div>{t("common:loading")}</div>;
  if (!quiz) return <div>{t("common:error")}</div>;

  if (result) {
    return (
      <div>
        <h2 className="page-title">{quiz.title}</h2>
        <p>{t("score", { score: result.score })}</p>
        <div className={`alert ${result.passed ? "alert--success" : "alert--error"}`}>
          {result.passed ? t("passed") : t("failed")}
        </div>
        {result.unlocked.length > 0 && <p>Unlocked: {result.unlocked.join(", ")}</p>}
        <Link to={`/learn/${moduleId}`} className="back-link">
          &larr; Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/learn/${moduleId}`} className="back-link">
        &larr; Back
      </Link>
      <h2 className="page-title">{quiz.title}</h2>
      <p className="page-subtitle">{t("passThreshold", { threshold: quiz.passThreshold })}</p>
      {submitError && (
        <div className="alert alert--error" role="alert">
          {submitError}
        </div>
      )}
      {queued && (
        <div className="alert alert--info" role="status">
          Your submission has been queued and will be sent when you are back online.
        </div>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="exercise">
            <div className="exercise__prompt">
              {i + 1}. {q.text}
            </div>
            <div className="exercise__options">
              {q.options.map((opt) => (
                <label
                  key={opt.key}
                  className={`exercise__option${answers[q.id] === opt.key ? " exercise__option--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.key}
                    checked={answers[q.id] === opt.key}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                  />{" "}
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className="btn btn--primary">
          {t("submitQuiz")}
        </button>
      </form>
    </div>
  );
}
