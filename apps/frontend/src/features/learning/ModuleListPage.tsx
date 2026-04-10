import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import type { Module, ProgressData, ModuleProgress } from "../../lib/api-types.ts";
import { progressPercent } from "../../lib/api-types.ts";
import { authClient } from "../../lib/auth-client.ts";
import { cacheContent, getCachedContent } from "../../lib/offline-db.ts";
import "../../styles/pages.css";

export function ModuleListPage() {
  const { t } = useTranslation("learning");
  const { data: session } = authClient.useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = session?.user.id;

  useEffect(() => {
    async function load() {
      const cacheKey = userId ? `modules:${userId}` : "modules";
      try {
        const [data, prog] = await Promise.all([
          apiFetch<Module[]>("/api/content/modules"),
          apiFetch<ProgressData>("/api/progress").catch(() => null),
        ]);
        setModules(data);
        if (prog) setProgress(prog.modules);
        void cacheContent(cacheKey, data);
      } catch {
        const cached = await getCachedContent(cacheKey);
        if (cached) {
          setModules(cached as Module[]);
        } else {
          setError(t("modulesUnavailable"));
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [userId]);

  if (loading) {
    return (
      <div className="module-list">
        <div className="lesson-page__loading">
          <div className="lesson-page__loading-bar" />
        </div>
      </div>
    );
  }

  const totalModules = modules.length;

  return (
    <div className="module-list">
      <div className="module-list__header">
        <h2 className="module-list__title">{t("modules")}</h2>
        {totalModules > 0 && (
          <span className="module-list__count">{t("moduleCount", { count: totalModules })}</span>
        )}
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="card-grid">
        {modules.map((mod, i) => {
          const mp = progress[mod.id];
          return (
            <div
              key={mod.id}
              className={`card module-card ${mod.locked ? "card--locked" : "card--interactive"} module-card--enter`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {mod.locked ? (
                <div>
                  <div className="card__title">{mod.title}</div>
                  <span className="badge badge--locked">🔒 {t("locked")}</span>
                  <p className="card__description">{mod.description}</p>
                </div>
              ) : (
                <Link to={`/learn/${mod.id}`} className="card__link">
                  <div className="card__title">{mod.title}</div>
                  {mp && (
                    <div className="card__progress">
                      <span className="card__progress-text">
                        {t("lessonsCompleted", {
                          completed: mp.lessonsCompleted,
                          total: mp.lessonsTotal,
                        })}
                      </span>
                      <div className="card__progress-track">
                        <div
                          className="card__progress-fill"
                          style={{ width: progressPercent(mp.lessonsCompleted, mp.lessonsTotal) }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="card__description">{mod.description}</p>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
