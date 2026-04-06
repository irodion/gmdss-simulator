import { useTranslation } from "react-i18next";

import { useOnlineStatus } from "../lib/use-online-status.ts";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      style={{ background: "#d67a39", color: "#fff", padding: "8px 16px", textAlign: "center" }}
    >
      {t("offlineBanner")}
    </div>
  );
}
