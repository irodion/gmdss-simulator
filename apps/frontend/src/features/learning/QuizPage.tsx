import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch, ApiError } from "../../lib/api-client.ts";
import { addPendingAction } from "../../lib/offline-db.ts";

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
      <div style={{ padding: 16 }}>
        <h2>{quiz.title}</h2>
        <p>{t("score", { score: result.score })}</p>
        <p style={{ color: result.passed ? "#57f04f" : "#e54" }}>
          {result.passed ? t("passed") : t("failed")}
        </p>
        {result.unlocked.length > 0 && <p>Unlocked: {result.unlocked.join(", ")}</p>}
        <Link to={`/learn/${moduleId}`}>&larr; Back to lessons</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Link to={`/learn/${moduleId}`}>&larr; Back</Link>
      <h2>{quiz.title}</h2>
      <p>{t("passThreshold", { threshold: quiz.passThreshold })}</p>
      {submitError && (
        <p role="alert" style={{ color: "#e54" }}>
          {submitError}
        </p>
      )}
      {queued && (
        <p role="status" style={{ color: "#f0c040" }}>
          Your submission has been queued and will be sent when you are back online.
        </p>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        {quiz.questions.map((q, i) => (
          <fieldset
            key={q.id}
            style={{ marginBottom: 16, border: "1px solid #2a435a", padding: 12, borderRadius: 8 }}
          >
            <legend>
              {i + 1}. {q.text}
            </legend>
            {q.options.map((opt) => (
              <label key={opt.key} style={{ display: "block", margin: "4px 0" }}>
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
          </fieldset>
        ))}
        <button type="submit">{t("submitQuiz")}</button>
      </form>
    </div>
  );
}
