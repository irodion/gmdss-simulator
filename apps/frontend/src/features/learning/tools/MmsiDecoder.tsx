import { useState } from "react";
import { useTranslation } from "react-i18next";
import { decodeMmsi, formatMmsi } from "@gmdss-simulator/utils";
import "../../../styles/pages.css";

interface MmsiDecoderProps {
  config?: { mmsi?: string };
}

export function MmsiDecoder({ config }: MmsiDecoderProps) {
  const { t } = useTranslation("tools");
  const [input, setInput] = useState(config?.mmsi ?? "");

  const cleaned = input.replace(/[\s-]/g, "");
  const result = cleaned.length > 0 ? decodeMmsi(cleaned) : null;

  return (
    <div>
      <div className="form-group">
        <label className="form-label">{t("mmsiDecoder.title")}</label>
        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          maxLength={11}
          placeholder={t("mmsiDecoder.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          {result.valid ? (
            <>
              <div className="output-field">
                <span className="output-field__label">{t("mmsiDecoder.stationType")}</span>
                <span className="output-field__value" style={{ textTransform: "capitalize" }}>
                  {result.stationType?.replace(/_/g, " ")}
                </span>
              </div>
              {result.mid && (
                <div className="output-field">
                  <span className="output-field__label">{t("mmsiDecoder.mid")}</span>
                  <span className="output-field__value">{result.mid}</span>
                </div>
              )}
              {result.country && (
                <div className="output-field">
                  <span className="output-field__label">{t("mmsiDecoder.country")}</span>
                  <span className="output-field__value">{result.country}</span>
                </div>
              )}
              {result.description && (
                <div className="output-field">
                  <span className="output-field__label">{t("mmsiDecoder.details")}</span>
                  <span className="output-field__value">{result.description}</span>
                </div>
              )}
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "monospace",
                  fontSize: 18,
                  letterSpacing: 4,
                  color: "var(--lcd-0)",
                }}
              >
                {formatMmsi(result.mmsi)}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--error)" }}>{result.error ?? t("mmsiDecoder.invalid")}</p>
          )}
        </div>
      )}
    </div>
  );
}
