import { useTranslation } from "react-i18next";

import { useOnlineStatus } from "../lib/use-online-status.ts";
import "../styles/tokens.css";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      style={{
        background: "var(--orange-0)",
        color: "#fff",
        padding: "8px 16px",
        textAlign: "center",
      }}
    >
      {t("offlineBanner")}
    </div>
  );
}
