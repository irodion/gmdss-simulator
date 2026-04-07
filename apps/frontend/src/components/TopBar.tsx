import { useTranslation } from "react-i18next";

import { useOnlineStatus } from "../lib/use-online-status.ts";
import { StatusPill } from "./StatusPill.tsx";

export function TopBar() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  return (
    <header className="topbar app-shell__topbar">
      <div className="topbar__brand">
        <h1 className="topbar__title">{t("appName")}</h1>
        <span className="topbar__subtitle">{t("subtitle")}</span>
      </div>
      <div className="topbar__status">
        <StatusPill label={isOnline ? t("online") : t("offline")} online={isOnline} />
      </div>
    </header>
  );
}
