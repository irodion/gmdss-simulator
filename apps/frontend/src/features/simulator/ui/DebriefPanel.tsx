import { useTranslation } from "react-i18next";
import type { Turn, ScoreBreakdown } from "@gmdss-simulator/utils";
import { ChatBubble } from "./ChatBubble.tsx";

interface DebriefPanelProps {
  turns: readonly Turn[];
  score: ScoreBreakdown;
  stationPersona: string;
  onRetry: () => void;
  onBack: () => void;
}

export function DebriefPanel({ turns, score, stationPersona, onRetry, onBack }: DebriefPanelProps) {
  const { t } = useTranslation("simulator");

  return (
    <div className="sim-debrief">
      <h2 className="sim-debrief__title">{t("debrief.title")}</h2>

      <div className="sim-debrief__score">{score.overall}%</div>

      <div className="sim-debrief__dimensions">
        {score.dimensions.map((dim) => (
          <div key={dim.id} className="sim-debrief__dim">
            <div className="sim-debrief__dim-label">{t(`scoring.${dim.id}`)}</div>
            <div className="sim-debrief__dim-score">{dim.score}%</div>
            {dim.missingItems.length > 0 && (
              <ul
                style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: 13, color: "#b8c0c9" }}
              >
                {dim.missingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 12, color: "#e9edf1" }}>
        {t("debrief.transcript")}
      </h3>
      {turns.map((turn) => (
        <ChatBubble
          key={turn.index}
          speaker={turn.speaker === "student" ? "student" : "station"}
          tag={turn.speaker === "student" ? t("debrief.you") : stationPersona}
          text={turn.text}
        />
      ))}

      <div className="sim-debrief__actions">
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          {t("retry")}
        </button>
        <button type="button" className="btn" onClick={onBack}>
          {t("backToScenarios")}
        </button>
      </div>
    </div>
  );
}
