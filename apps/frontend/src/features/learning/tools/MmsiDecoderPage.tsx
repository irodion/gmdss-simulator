import { useTranslation } from "react-i18next";
import { MmsiDecoder } from "./MmsiDecoder.tsx";
import "../../../styles/pages.css";

export function MmsiDecoderPage() {
  const { t } = useTranslation("tools");

  return (
    <div>
      <h1 className="page-title">{t("mmsiDecoder.title")}</h1>
      <p className="page-subtitle">{t("mmsiDecoder.description")}</p>
      <MmsiDecoder />
    </div>
  );
}
