import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import { statusBadgeClass, progressPercent } from "../../lib/api-types.ts";
import type { ProgressData } from "../../lib/api-types.ts";
import "../../styles/pages.css";

export function ProgressPage() {
  const { t } = useTranslation("progress");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");

  function loadProgress() {
    setError("");
    void apiFetch<ProgressData>("/api/progress")
      .then(setProgress)
      .catch(() => {
        setError("Failed to load progress");
      });
  }

  useEffect(() => {
    loadProgress();
  }, []);

  if (error) {
    return (
      <div>
        <div className="alert alert--error" role="alert">
          {error}
        </div>
        <button type="button" className="btn" onClick={loadProgress}>
          Retry
        </button>
      </div>
    );
  }

  if (!progress) return <div>{t("common:loading")}</div>;

  return (
    <div>
      <h2 className="page-title">{t("title")}</h2>
      <div className="card-grid">
        {Object.entries(progress.modules).map(([id, mod]) => (
          <div key={id} className="card">
            <div className="card__title">{id}</div>
            <span className={statusBadgeClass(mod.status)}>{t(`learning:${mod.status}`)}</span>
            <div className="card__meta">
              {t("learning:lessonsCompleted", {
                completed: mod.lessonsCompleted,
                total: mod.lessonsTotal,
              })}
            </div>
            {mod.quizBestScore !== null && (
              <div className="card__meta">{t("learning:score", { score: mod.quizBestScore })}</div>
            )}
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{
                  width: progressPercent(mod.lessonsCompleted, mod.lessonsTotal),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
