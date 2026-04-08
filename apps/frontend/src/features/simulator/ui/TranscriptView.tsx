import { useTranslation } from "react-i18next";
import type { Turn, ScoreBreakdown } from "@gmdss-simulator/utils";
import { ChatBubble } from "./ChatBubble.tsx";
import { ScoreGauge } from "./ScoreGauge.tsx";

interface TranscriptViewProps {
  turns: readonly Turn[];
  stationPersona: string;
  score: ScoreBreakdown | null;
}

export function TranscriptView({ turns, stationPersona, score }: TranscriptViewProps) {
  const { t } = useTranslation("simulator");

  const topMissing = score?.dimensions.flatMap((d) => d.missingItems).at(0);

  return (
    <section className="sim-transcript-card" aria-label={t("transcript")}>
      <div className="sim-side-title">{t("transcript")}</div>

      {turns.map((turn) => (
        <ChatBubble
          key={turn.index}
          speaker={turn.speaker === "student" ? "student" : "station"}
          tag={turn.speaker === "student" ? t("debrief.you") : stationPersona}
          text={turn.text}
        />
      ))}

      {score && (
        <div className="sim-score-row">
          <ScoreGauge value={score.overall} />
          {topMissing && (
            <div className="sim-missing-card">
              <div className="sim-missing-label">{t("scoring.missingField")}</div>
              <div className="sim-missing-value">{topMissing}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
