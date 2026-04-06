import { useParams, Link, useNavigate } from "react-router";

import { apiFetch, ApiError } from "../../lib/api-client.ts";
import { addPendingAction } from "../../lib/offline-db.ts";

export function LessonPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();

  async function handleComplete() {
    const path = `/api/progress/lesson/${lessonId}/complete`;
    try {
      await apiFetch(path, { method: "POST" });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      await addPendingAction("POST", path);
    }
    void navigate(`/learn/${moduleId}`);
  }

  return (
    <div style={{ padding: 16 }}>
      <Link to={`/learn/${moduleId}`}>&larr; Back to lessons</Link>
      <h2>Lesson: {lessonId}</h2>
      <p>Lesson content will be loaded from content files in a future phase.</p>
      <button type="button" onClick={() => void handleComplete()}>
        Mark as complete
      </button>
    </div>
  );
}
