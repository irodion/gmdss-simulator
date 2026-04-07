import { useTranslation } from "react-i18next";
import { ScriptBuilder } from "./ScriptBuilder.tsx";
import "../../../styles/pages.css";

export function ScriptBuilderPage() {
  const { t } = useTranslation("tools");

  return (
    <div>
      <h1 className="page-title">{t("scriptBuilder.title")}</h1>
      <p className="page-subtitle">{t("scriptBuilder.description")}</p>
      <ScriptBuilder />
    </div>
  );
}
