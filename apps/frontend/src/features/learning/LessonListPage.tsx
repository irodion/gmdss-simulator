import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";

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

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Lesson[]>(`/api/content/modules/${moduleId}/lessons`);
        setLessons(data);
      } catch {
        // TODO: load from cache
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [moduleId]);

  if (loading) return <div>{t("common:loading")}</div>;

  return (
    <div style={{ padding: 16 }}>
      <Link to="/learn">&larr; {t("modules")}</Link>
      <h2>{t("lessons")}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            style={{ marginBottom: 8, padding: 12, border: "1px solid #2a435a", borderRadius: 8 }}
          >
            <Link
              to={`/learn/${moduleId}/${lesson.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {lesson.title}
              {lesson.completed && <span style={{ marginLeft: 8, color: "#57f04f" }}>✓</span>}
            </Link>
          </li>
        ))}
      </ul>
      <Link to={`/learn/${moduleId}/quiz`}>{t("startQuiz")}</Link>
    </div>
  );
}
