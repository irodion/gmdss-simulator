import { useTranslation } from "react-i18next";
import { DscBuilder } from "./DscBuilder.tsx";
import "../../../styles/pages.css";

export function DscBuilderPage() {
  const { t } = useTranslation("tools");

  return (
    <div>
      <h1 className="page-title">{t("dscBuilder.title")}</h1>
      <p className="page-subtitle">{t("dscBuilder.description")}</p>
      <DscBuilder />
    </div>
  );
}
