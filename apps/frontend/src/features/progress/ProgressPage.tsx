import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";

interface ModuleProgress {
  lessonsCompleted: number;
  lessonsTotal: number;
  quizBestScore: number | null;
  quizPassed: boolean;
  status: "locked" | "in_progress" | "completed";
}

interface ProgressData {
  modules: Record<string, ModuleProgress>;
}

export function ProgressPage() {
  const { t } = useTranslation("progress");
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    void apiFetch<ProgressData>("/api/progress")
      .then(setProgress)
      .catch(() => {});
  }, []);

  if (!progress) return <div>{t("common:loading")}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>{t("title")}</h2>
      {Object.entries(progress.modules).map(([id, mod]) => (
        <div
          key={id}
          style={{ marginBottom: 12, padding: 12, border: "1px solid #2a435a", borderRadius: 8 }}
        >
          <strong>{id}</strong>
          <span style={{ marginLeft: 8 }}>{t(`learning:${mod.status}`)}</span>
          <div>
            {t("learning:lessonsCompleted", {
              completed: mod.lessonsCompleted,
              total: mod.lessonsTotal,
            })}
          </div>
          {mod.quizBestScore !== null && (
            <div>{t("learning:score", { score: mod.quizBestScore })}</div>
          )}
        </div>
      ))}
    </div>
  );
}
