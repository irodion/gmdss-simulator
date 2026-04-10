import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import { progressPercent } from "../../lib/api-types.ts";
import type { Module, ProgressData, ModuleProgress } from "../../lib/api-types.ts";
import { authClient } from "../../lib/auth-client.ts";
import "../../styles/pages.css";
import "./progress.css";

type ClearState = "idle" | "confirming" | "clearing";

const RING_RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ProgressPage() {
  const { t } = useTranslation("progress");
  const { data: session } = authClient.useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");
  const [clearState, setClearState] = useState<ClearState>("idle");
  const [clearError, setClearError] = useState("");

  const loadProgress = useCallback(() => {
    setError("");
    void Promise.all([
      apiFetch<Module[]>("/api/content/modules"),
      apiFetch<ProgressData>("/api/progress"),
    ])
      .then(([mods, prog]) => {
        setModules(mods);
        setProgress(prog);
      })
      .catch(() => {
        setError("Failed to load progress");
      });
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  async function handleClear() {
    setClearState("clearing");
    setClearError("");
    try {
      await apiFetch("/api/progress", { method: "DELETE" });
      setClearState("idle");
      loadProgress();
    } catch {
      setClearState("idle");
      setClearError("Failed to clear progress");
    }
  }

  const stats = useMemo(() => {
    if (!progress) return null;
    const entries = modules.map((mod) => ({
      module: mod,
      progress: progress.modules[mod.id],
    }));

    let totalLessons = 0;
    let completedLessons = 0;
    let completedModules = 0;
    let quizzesPassed = 0;
    for (const e of entries) {
      totalLessons += e.progress?.lessonsTotal ?? 0;
      completedLessons += e.progress?.lessonsCompleted ?? 0;
      if (e.progress?.status === "completed") completedModules++;
      if (e.progress?.quizPassed) quizzesPassed++;
    }

    return {
      entries,
      totalModules: entries.length,
      completedModules,
      totalLessons,
      completedLessons,
      quizzesPassed,
      overallPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  }, [modules, progress]);

  if (error) {
    return (
      <div className="me-page">
        <div className="alert alert--error" role="alert">
          {error}
        </div>
        <button type="button" className="btn" onClick={loadProgress}>
          {t("common:retry")}
        </button>
      </div>
    );
  }

  if (!stats) return <div className="me-page">{t("common:loading")}</div>;

  const {
    entries,
    totalModules,
    completedModules,
    totalLessons,
    completedLessons,
    quizzesPassed,
    overallPct,
  } = stats;

  return (
    <div className="me-page">
      <div className="me-header">
        <div className="me-header__avatar">
          {session?.user.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="me-header__info">
          <h1 className="me-header__name">{session?.user.name ?? ""}</h1>
          <p className="me-header__email">{session?.user.email ?? ""}</p>
        </div>
      </div>

      <div className="me-gauge">
        <div className="me-gauge__ring-wrap">
          <svg className="me-gauge__ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--surface-dark)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--orange-0)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={`${CIRCUMFERENCE * (1 - overallPct / 100)}`}
              transform="rotate(-90 60 60)"
              className="me-gauge__arc"
            />
          </svg>
          <span className="me-gauge__pct">{overallPct}%</span>
        </div>
        <span className="me-gauge__sub">{t("overallProgress")}</span>
      </div>

      <div className="me-stats">
        <div className="me-stat">
          <span className="me-stat__value">
            {completedLessons}/{totalLessons}
          </span>
          <span className="me-stat__label">{t("lessonsDone", { count: completedLessons })}</span>
        </div>
        <div className="me-stat__divider" />
        <div className="me-stat">
          <span className="me-stat__value">
            {quizzesPassed}/{totalModules}
          </span>
          <span className="me-stat__label">{t("quizzesPassedLabel")}</span>
        </div>
        <div className="me-stat__divider" />
        <div className="me-stat">
          <span className="me-stat__value">
            {completedModules}/{totalModules}
          </span>
          <span className="me-stat__label">{t("learning:modules")}</span>
        </div>
      </div>

      <h2 className="me-section-title">{t("moduleProgress")}</h2>
      <div className="me-modules">
        {entries.map(({ module: mod, progress: p }, i) => (
          <ModuleRow key={mod.id} mod={mod} progress={p} index={i} />
        ))}
      </div>

      <div className="me-danger-zone">
        {clearError && (
          <div className="alert alert--error" role="alert" style={{ marginBottom: 12 }}>
            {clearError}
          </div>
        )}

        {clearState === "idle" && (
          <button
            type="button"
            className="btn me-clear-btn"
            onClick={() => setClearState("confirming")}
          >
            {t("clearProgress")}
          </button>
        )}

        {clearState === "confirming" && (
          <div className="me-clear-confirm">
            <p className="me-clear-confirm__text">{t("clearProgressConfirm")}</p>
            <div className="me-clear-confirm__actions">
              <button type="button" className="btn" onClick={() => setClearState("idle")}>
                {t("clearProgressCancel")}
              </button>
              <button
                type="button"
                className="btn me-clear-btn--danger"
                onClick={() => void handleClear()}
              >
                {t("clearProgressAction")}
              </button>
            </div>
          </div>
        )}

        {clearState === "clearing" && <span className="me-clearing">{t("clearing")}</span>}
      </div>
    </div>
  );
}

function ModuleRow({
  mod,
  progress: p,
  index,
}: {
  mod: Module;
  progress: ModuleProgress | undefined;
  index: number;
}) {
  const { t } = useTranslation("progress");

  if (!p) return null;

  const statusClass =
    p.status === "completed" ? "me-mod--completed" : p.status === "locked" ? "me-mod--locked" : "";

  return (
    <div
      className={`me-mod module-card--enter ${statusClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="me-mod__header">
        <span className="me-mod__number">{index + 1}</span>
        <div className="me-mod__info">
          <span className="me-mod__title">{mod.title}</span>
          <span className="me-mod__meta">
            {t("learning:lessonsCompleted", {
              completed: p.lessonsCompleted,
              total: p.lessonsTotal,
            })}
            {p.quizBestScore !== null && (
              <> &middot; {t("bestScore", { score: p.quizBestScore })}</>
            )}
          </span>
        </div>
        <StatusDot status={p.status} />
      </div>
      <div className="me-mod__track">
        <div
          className="me-mod__fill"
          style={{ width: progressPercent(p.lessonsCompleted, p.lessonsTotal) }}
        />
      </div>
      {p.status === "completed" && <div className="me-mod__badge">{t("learning:completed")}</div>}
    </div>
  );
}

function StatusDot({ status }: { status: ModuleProgress["status"] }) {
  const { t } = useTranslation("learning");

  const cls =
    status === "completed"
      ? "me-dot--complete"
      : status === "locked"
        ? "me-dot--locked"
        : "me-dot--progress";

  return <span className={`me-dot ${cls}`} title={t(status)} aria-label={t(status)} />;
}
