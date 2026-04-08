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

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;

  if (loading) {
    return (
      <div className="lesson-list">
        <div className="lesson-page__loading">
          <div className="lesson-page__loading-bar" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-list">
        <div className="alert alert--error" role="alert">
          {error}
        </div>
        <Link to="/learn" className="lesson-page__back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("modules")}
        </Link>
      </div>
    );
  }

  return (
    <div className="lesson-list">
      {/* Header */}
      <div className="lesson-list__header">
        <Link to="/learn" className="lesson-page__back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("modules")}
        </Link>

        {totalCount > 0 && (
          <div className="lesson-list__progress">
            <span className="lesson-list__progress-text">
              {t("lessonsCompleted", { completed: completedCount, total: totalCount })}
            </span>
            <div className="lesson-list__progress-track">
              <div
                className="lesson-list__progress-fill"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <h2 className="lesson-list__title">{t("lessons")}</h2>

      {/* Lesson list */}
      <div className="lesson-list__items">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/learn/${moduleId}/${lesson.id}`}
            className={`lesson-list__item ${lesson.completed ? "lesson-list__item--completed" : ""}`}
          >
            <span className="lesson-list__item-number">{lesson.orderIndex}</span>
            <span className="lesson-list__item-title">{lesson.title}</span>
            {lesson.completed && (
              <span className="lesson-list__item-check" aria-label="Completed">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M3.75 9L7.5 12.75L14.25 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Quiz action */}
      <div className="lesson-list__quiz-area">
        <div className="lesson-list__quiz-label">{t("checkpoint")}</div>
        <Link to={`/learn/${moduleId}/quiz`} className="lesson-page__complete-btn">
          {t("startQuiz")}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M6.75 4.5L12 9L6.75 13.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
