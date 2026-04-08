import { useTranslation } from "react-i18next";
import type { ScoreBreakdown, ScoringDimensionId } from "@gmdss-simulator/utils";

interface FeedbackCardProps {
  score: ScoreBreakdown | null;
  feedbackText?: string;
}

function chipVariant(score: number): string {
  if (score >= 80) return "sim-chip--pass";
  if (score >= 40) return "sim-chip--partial";
  return "sim-chip--miss";
}

const DIMENSION_ORDER: ScoringDimensionId[] = [
  "required_fields",
  "prowords",
  "sequence",
  "channel",
];

export function FeedbackCard({ score, feedbackText }: FeedbackCardProps) {
  const { t } = useTranslation("simulator");

  return (
    <div className="sim-feedback">
      <div className="sim-feedback__title">{t("feedback")}</div>
      <div className="sim-feedback__tags">
        {DIMENSION_ORDER.map((id) => {
          const dim = score?.dimensions.find((d) => d.id === id);
          const variant = dim ? chipVariant(dim.score) : "";
          return (
            <span key={id} className={`sim-chip ${variant}`}>
              {t(`scoring.${id}`)}
              {dim ? ` ${dim.score}%` : ""}
            </span>
          );
        })}
      </div>
      {feedbackText && <div className="sim-feedback__text">{feedbackText}</div>}
    </div>
  );
}
