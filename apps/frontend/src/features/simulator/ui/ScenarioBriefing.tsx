import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ScenarioDefinition } from "@gmdss-simulator/utils";

interface ScenarioBriefingProps {
  scenario: ScenarioDefinition;
}

export function ScenarioBriefing({ scenario }: ScenarioBriefingProps) {
  const { t } = useTranslation("simulator");
  const [showScript, setShowScript] = useState(false);

  const categoryClass = `sim-category-pill sim-category-pill--${scenario.category}`;

  function resolveScript(template: string): string {
    return template
      .replace(/\{\{vesselName\}\}/g, scenario.vessel.name)
      .replace(
        /\{\{stationName\}\}/g,
        scenario.stationName ?? scenario.stationPersona.replace(/_/g, " "),
      )
      .replace(/\{\{position\}\}/g, scenario.vessel.position ?? "")
      .replace(/\{\{channel\}\}/g, String(scenario.requiredChannel))
      .replace(/\{\{course\}\}/g, "180")
      .replace(/\{\{speed\}\}/g, "8");
  }

  return (
    <section className="sim-briefing-frame" aria-label={t("scenarioBriefing")}>
      <div className="sim-briefing-inner">
        <div className="sim-side-title">{t("scenarioBriefing")}</div>
        <div className={categoryClass}>{t(`category.${scenario.category}`)}</div>
        <h2 className="sim-scenario-title">{scenario.title}</h2>
        <p className="sim-scenario-meta">
          {scenario.vessel.name}
          {scenario.vessel.callsign ? ` / Callsign ${scenario.vessel.callsign}` : ""}
        </p>
        {scenario.vessel.position && (
          <p className="sim-scenario-row">
            {t("scenario.position")} {scenario.vessel.position}
          </p>
        )}
        {scenario.vessel.personsOnBoard != null && (
          <p className="sim-scenario-row">
            {t("scenario.personsOnBoard")} {scenario.vessel.personsOnBoard}
          </p>
        )}
        <div className="sim-task-label">{t("scenario.task")}</div>
        <div className="sim-task-copy">{scenario.task}</div>
        {scenario.scriptReference && (
          <>
            <button
              type="button"
              className="sim-script-btn"
              onClick={() => setShowScript((s) => !s)}
            >
              {t("scenario.scriptReference")}
            </button>
            {showScript && (
              <div className="sim-task-copy" style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
                {resolveScript(scenario.scriptReference)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
