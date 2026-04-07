import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import "../../styles/pages.css";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  completed: boolean;
}

export function LessonListPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { t } = useTranslation("learning");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLessons([]);
    setError("");

    async function load() {
      try {
        const data = await apiFetch<Lesson[]>(`/api/content/modules/${moduleId}/lessons`);
        setLessons(data);
      } catch {
        setError("Failed to load lessons");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [moduleId]);

  if (loading) return <div>{t("common:loading")}</div>;

  if (error) {
    return (
      <div>
        <div className="alert alert--error" role="alert">
          {error}
        </div>
        <Link to="/learn" className="back-link">
          &larr; {t("modules")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/learn" className="back-link">
        &larr; {t("modules")}
      </Link>
      <h2 className="page-title">{t("lessons")}</h2>
      <div className="card-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="card card--interactive">
            <Link
              to={`/learn/${moduleId}/${lesson.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="card__title">
                {lesson.title}
                {lesson.completed && (
                  <span style={{ marginLeft: 8, color: "var(--success)" }}>✓</span>
                )}
              </span>
            </Link>
          </div>
        ))}
      </div>
      <Link to={`/learn/${moduleId}/quiz`} className="btn btn--primary">
        {t("startQuiz")}
      </Link>
    </div>
  );
}
