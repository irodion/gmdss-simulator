import { useTranslation } from "react-i18next";
import { ChannelExplorer } from "./ChannelExplorer.tsx";
import "../../../styles/pages.css";

export function ChannelExplorerPage() {
  const { t } = useTranslation("tools");

  return (
    <div>
      <h1 className="page-title">{t("channelExplorer.title")}</h1>
      <p className="page-subtitle">{t("channelExplorer.description")}</p>
      <ChannelExplorer />
    </div>
  );
}
