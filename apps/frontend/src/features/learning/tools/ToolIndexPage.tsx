import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { TOOLS } from "../../../lib/tool-defs.ts";
import "../../../styles/pages.css";

export function ToolIndexPage() {
  const { t } = useTranslation("tools");

  return (
    <div>
      <h1 className="page-title">{t("title")}</h1>
      <div className="card-grid">
        {TOOLS.map((tool) => (
          <Link key={tool.id} to={`/tools/${tool.id}`} style={{ textDecoration: "none" }}>
            <div className="card card--interactive">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</div>
              <div className="card__title">{t(`${tool.i18nKey}.title`)}</div>
              <div className="card__description">{t(`${tool.i18nKey}.description`)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
