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
  const [lessonTitle, setLessonTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setContent(null);

    async function loadContent() {
      const cacheKey = `lesson:${moduleId}:${lessonId}`;

      // Try to get lesson metadata (contentPath) from API
      let lesson: LessonMeta | undefined;
      try {
        const lessons = await apiFetch<LessonMeta[]>(`/api/content/modules/${moduleId}/lessons`);
        lesson = lessons.find((l) => l.id === lessonId);
      } catch {
        // API unavailable — fall through to cache
      }

      if (!lesson) {
        // No metadata from API — try serving from cache directly
        const cached = (await getCachedContent(cacheKey)) as LessonContent | null;
        if (cached && !controller.signal.aborted) {
          setContent(cached);
          setLessonTitle(cached.title);
        } else if (!controller.signal.aborted) {
          setError("Lesson not found");
        }
        if (!controller.signal.aborted) setLoading(false);
        return;
      }

      setLessonTitle(lesson.title);

      // Fetch content from static file, fall back to cache
      try {
        const res = await fetch(`/content/${lesson.contentPath}`, {
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
          setError("Lesson content unavailable. Try again when online.");
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

  return (
    <div>
      <Link to={`/learn/${moduleId}`} className="back-link">
        &larr; {t("learning:lessons")}
      </Link>

      {lessonTitle && <h1 className="page-title">{lessonTitle}</h1>}

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {loading && <p style={{ color: "var(--text-dim)" }}>{t("loading")}</p>}

      {content && <LessonRenderer content={content} />}

      {!loading && content && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--frame-line)" }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleComplete()}
            disabled={completing}
          >
            {completing ? t("loading") : t("learning:markComplete")}
          </button>
        </div>
      )}
    </div>
  );
}
