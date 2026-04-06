import { Outlet, NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import { OfflineBanner } from "./OfflineBanner.tsx";
import { authClient } from "../lib/auth-client.ts";

export function Layout() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();

  return (
    <div>
      <OfflineBanner />
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #2a435a",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.2rem" }}>{t("appName")}</h1>
        {session && (
          <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <NavLink to="/learn">{t("nav.learn")}</NavLink>
            <NavLink to="/progress">{t("nav.profile")}</NavLink>
            <button type="button" onClick={() => void authClient.signOut()}>
              {t("signOut")}
            </button>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
