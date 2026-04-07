import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import { statusBadgeClass, progressPercent } from "../../lib/api-types.ts";
import type { Module, ProgressData } from "../../lib/api-types.ts";
import { TOOLS } from "../../lib/tool-defs.ts";
import "../../styles/pages.css";

export function DashboardPage() {
  const { t } = useTranslation();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mods, prog] = await Promise.all([
          apiFetch<Module[]>("/api/content/modules"),
          apiFetch<ProgressData>("/api/progress"),
        ]);
        setModules(mods);
        setProgress(prog);
      } catch {
        // silent fail — page still renders
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const nextModule = modules.find((m) => {
    const p = progress?.modules[m.id];
    return p && p.status === "in_progress";
  });

  return (
    <div>
      <h1 className="page-title">{t("learning:dashboard")}</h1>

      {loading && <p style={{ color: "var(--text-dim)" }}>{t("loading")}</p>}

      {!loading && nextModule && (
        <Link to={`/learn/${nextModule.id}`} style={{ textDecoration: "none" }}>
          <div className="card card--interactive" style={{ marginBottom: 24 }}>
            <div className="card__meta">{t("learning:continueLearning")}</div>
            <div className="card__title">{nextModule.title}</div>
            <div className="card__description">{nextModule.description}</div>
          </div>
        </Link>
      )}

      {!loading && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {t("learning:curriculum")}
          </h2>
          <div className="card-grid">
            {modules.map((mod) => {
              const p = progress?.modules[mod.id];
              const status = p?.status ?? "locked";
              return (
                <Link
                  key={mod.id}
                  to={mod.locked ? "#" : `/learn/${mod.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className={`card${mod.locked ? " card--locked" : " card--interactive"}`}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div className="card__title">{mod.title}</div>
                      <span className={statusBadgeClass(status)}>{t(`learning:${status}`)}</span>
                    </div>
                    <div className="card__description">{mod.description}</div>
                    {p && (
                      <>
                        <div className="card__meta">
                          {t("learning:lessonsCompleted", {
                            completed: p.lessonsCompleted,
                            total: p.lessonsTotal,
                          })}
                          {p.quizBestScore !== null &&
                            ` · ${t("learning:score", { score: p.quizBestScore })}`}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar__fill"
                            style={{
                              width: progressPercent(p.lessonsCompleted, p.lessonsTotal),
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {t("learning:referenceTools")}
          </h2>
          <div className="card-grid">
            {TOOLS.map((tool) => (
              <Link key={tool.id} to={`/tools/${tool.id}`} style={{ textDecoration: "none" }}>
                <div className="card card--interactive">
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{tool.icon}</div>
                  <div className="card__title">{t(`tools:${tool.i18nKey}.title`)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
