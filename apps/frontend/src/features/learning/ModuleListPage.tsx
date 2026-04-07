import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import type { Module } from "../../lib/api-types.ts";
import { authClient } from "../../lib/auth-client.ts";
import { cacheContent, getCachedContent } from "../../lib/offline-db.ts";
import "../../styles/pages.css";

export function ModuleListPage() {
  const { t } = useTranslation("learning");
  const { data: session } = authClient.useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id;

  useEffect(() => {
    async function load() {
      const cacheKey = userId ? `modules:${userId}` : "modules";
      try {
        const data = await apiFetch<Module[]>("/api/content/modules");
        setModules(data);
        await cacheContent(cacheKey, data);
      } catch {
        const cached = await getCachedContent(cacheKey);
        if (cached) setModules(cached as Module[]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [userId]);

  if (loading) return <div>{t("common:loading")}</div>;

  return (
    <div>
      <h2 className="page-title">{t("modules")}</h2>
      <div className="card-grid">
        {modules.map((mod) => (
          <div key={mod.id} className={`card ${mod.locked ? "card--locked" : "card--interactive"}`}>
            {mod.locked ? (
              <div>
                <span className="card__title">{mod.title}</span>
                <span className="badge badge--locked">🔒 {t("locked")}</span>
                <p className="card__description">{mod.description}</p>
              </div>
            ) : (
              <Link to={`/learn/${mod.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <span className="card__title">{mod.title}</span>
                <p className="card__description">{mod.description}</p>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
