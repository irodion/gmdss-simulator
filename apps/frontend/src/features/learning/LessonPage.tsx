import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { LessonContent } from "@gmdss-simulator/utils";

import { apiFetch, ApiError } from "../../lib/api-client.ts";
import { addPendingAction, cacheContent, getCachedContent } from "../../lib/offline-db.ts";
import { LessonRenderer } from "./LessonRenderer.tsx";
import "../../styles/pages.css";

interface LessonMeta {
  id: string;
  title: string;
  orderIndex: number;
  contentPath: string;
  completed: boolean;
}

export function LessonPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [content, setContent] = useState<LessonContent | null>(null);
  const [lesson, setLesson] = useState<LessonMeta | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setContent(null);
    setLesson(null);

    async function loadContent() {
      const cacheKey = `lesson:${moduleId}:${lessonId}`;

      let lessons: LessonMeta[] = [];
      let found: LessonMeta | undefined;
      try {
        lessons = await apiFetch<LessonMeta[]>(`/api/content/modules/${moduleId}/lessons`);
        found = lessons.find((l) => l.id === lessonId);
      } catch {
        // API unavailable — fall through to cache
      }

      if (!found) {
        const cached = (await getCachedContent(cacheKey)) as LessonContent | null;
        if (cached && !controller.signal.aborted) {
          setContent(cached);
        } else if (!controller.signal.aborted) {
          setError(t("learning:lessonNotFound"));
        }
        if (!controller.signal.aborted) setLoading(false);
        return;
      }

      if (!controller.signal.aborted) {
        setLesson(found);
        setTotalLessons(lessons.length);
      }

      try {
        const res = await fetch(`/content/${found.contentPath}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Content not found");
        const data = (await res.json()) as LessonContent;
        if (!controller.signal.aborted) {
          setContent(data);
          void cacheContent(cacheKey, data);
        }
      } catch {
        if (controller.signal.aborted) return;
        const cached = (await getCachedContent(cacheKey)) as LessonContent | null;
        if (cached) {
          setContent(cached);
        } else {
          setError(t("learning:lessonUnavailable"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadContent();
    return () => {
      controller.abort();
    };
  }, [moduleId, lessonId]);

  async function handleComplete() {
    setCompleting(true);
    const path = `/api/progress/lesson/${lessonId}/complete`;
    try {
      await apiFetch(path, { method: "POST" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setCompleting(false);
        return;
      }
      await addPendingAction("POST", path);
    }
    void navigate(`/learn/${moduleId}`);
  }

  const lessonTitle = lesson?.title ?? content?.title ?? "";
  const lessonNumber = lesson?.orderIndex ?? 0;

  return (
    <div className="lesson-page">
      {/* Header bar */}
      <div className="lesson-page__header">
        <Link to={`/learn/${moduleId}`} className="lesson-page__back" aria-label="Back to lessons">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("learning:lessons")}
        </Link>

        {lesson && totalLessons > 0 && (
          <div className="lesson-page__progress-indicator">
            <span className="lesson-page__step">
              {lessonNumber} / {totalLessons}
            </span>
            <div className="lesson-page__progress-track">
              <div
                className="lesson-page__progress-fill"
                style={{ width: `${(lessonNumber / totalLessons) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Title area */}
      {lessonTitle && (
        <div className="lesson-page__title-area">
          {lessonNumber > 0 && (
            <span className="lesson-page__lesson-number">
              {t("learning:lessonLabel")} {lessonNumber}
            </span>
          )}
          <h1 className="lesson-page__title">{lessonTitle}</h1>
        </div>
      )}

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="lesson-page__loading">
          <div className="lesson-page__loading-bar" />
        </div>
      )}

      {/* Content card */}
      {content && (
        <div className="lesson-page__content-card">
          <LessonRenderer content={content} />
        </div>
      )}

      {/* Completion footer */}
      {!loading && content && (
        <div className="lesson-page__footer">
          <button
            type="button"
            className="lesson-page__complete-btn"
            onClick={() => void handleComplete()}
            disabled={completing}
          >
            {completing ? (
              t("loading")
            ) : (
              <>
                {t("learning:markComplete")}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M3.75 9L7.5 12.75L14.25 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
