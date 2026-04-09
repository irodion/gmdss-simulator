import { useTranslation } from "react-i18next";

interface Props {
  points: string[];
}

export function TakeawaySectionView({ points }: Props) {
  const { t } = useTranslation("learning");

  if (points.length === 0) return null;

  return (
    <div className="takeaway">
      <div className="takeaway__title">{t("keyTakeaways")}</div>
      <ul className="takeaway__list">
        {points.map((point, i) => (
          <li key={i} className="takeaway__item">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
