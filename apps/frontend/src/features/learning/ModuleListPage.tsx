import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { apiFetch } from "../../lib/api-client.ts";
import { authClient } from "../../lib/auth-client.ts";
import { cacheContent, getCachedContent } from "../../lib/offline-db.ts";

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  locked: boolean;
}

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
    <div style={{ padding: 16 }}>
      <h2>{t("modules")}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {modules.map((mod) => (
          <li
            key={mod.id}
            style={{
              marginBottom: 16,
              padding: 16,
              border: "1px solid #2a435a",
              borderRadius: 8,
              opacity: mod.locked ? 0.5 : 1,
            }}
          >
            {mod.locked ? (
              <div>
                <strong>{mod.title}</strong>
                <span style={{ marginLeft: 8 }}>🔒 {t("locked")}</span>
                <p>{mod.description}</p>
              </div>
            ) : (
              <Link to={`/learn/${mod.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <strong>{mod.title}</strong>
                <p>{mod.description}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
