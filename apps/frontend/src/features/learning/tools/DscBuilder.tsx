import { useState } from "react";
import { useTranslation } from "react-i18next";
import { buildDscMessage, natureOfDistressLabels } from "@gmdss-simulator/utils";
import type { DscCategory, NatureOfDistress, DscMessage } from "@gmdss-simulator/utils";
import "../../../styles/pages.css";

interface DscBuilderProps {
  config?: { category?: string };
}

const categories: DscCategory[] = ["distress", "urgency", "safety", "routine"];

export function DscBuilder({ config }: DscBuilderProps) {
  const { t } = useTranslation("tools");
  const initialCategory = categories.includes(config?.category as DscCategory)
    ? (config!.category as DscCategory)
    : "distress";
  const [category, setCategory] = useState<DscCategory>(initialCategory);
  const [mmsi, setMmsi] = useState("");
  const [targetMmsi, setTargetMmsi] = useState("");
  const [nature, setNature] = useState<NatureOfDistress>("undesignated");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [time, setTime] = useState("");
  const [workingChannel, setWorkingChannel] = useState("16");
  const [result, setResult] = useState<DscMessage | null>(null);

  function handleGenerate() {
    const position = lat && lon ? { lat, lon } : undefined;
    const channelNum = Number(workingChannel);

    const params =
      category === "distress"
        ? { mmsi, nature, position, time: time || undefined }
        : category === "routine"
          ? { mmsi, targetMmsi, workingChannel: channelNum }
          : { mmsi, workingChannel: channelNum, position };

    setResult(buildDscMessage(category, params));
  }

  return (
    <div>
      <div className="tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`tab${category === cat ? " tab--active" : ""}`}
            onClick={() => {
              setCategory(cat);
              setResult(null);
            }}
          >
            {t(`dscBuilder.${cat}`)}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="form-label">{t("dscBuilder.mmsi")}</label>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            maxLength={9}
            value={mmsi}
            onChange={(e) => setMmsi(e.target.value)}
          />
        </div>

        {category === "routine" && (
          <div className="form-group">
            <label className="form-label">{t("dscBuilder.targetMmsi")}</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={targetMmsi}
              onChange={(e) => setTargetMmsi(e.target.value)}
            />
          </div>
        )}

        {category === "distress" && (
          <div className="form-group">
            <label className="form-label">{t("dscBuilder.nature")}</label>
            <select
              className="form-select"
              value={nature}
              onChange={(e) => setNature(e.target.value as NatureOfDistress)}
            >
              {(Object.keys(natureOfDistressLabels) as NatureOfDistress[]).map((key) => (
                <option key={key} value={key}>
                  {natureOfDistressLabels[key]}
                </option>
              ))}
            </select>
          </div>
        )}

        {category !== "routine" && (
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t("dscBuilder.latitude")}</label>
              <input
                className="form-input"
                type="text"
                placeholder="36°08'N"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t("dscBuilder.longitude")}</label>
              <input
                className="form-input"
                type="text"
                placeholder="005°21'W"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </div>
          </div>
        )}

        {category === "distress" && (
          <div className="form-group">
            <label className="form-label">{t("dscBuilder.time")}</label>
            <input
              className="form-input"
              type="text"
              placeholder="1435"
              maxLength={4}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        )}

        {category !== "distress" && (
          <div className="form-group">
            <label className="form-label">{t("dscBuilder.workingChannel")}</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={88}
              value={workingChannel}
              onChange={(e) => setWorkingChannel(e.target.value)}
            />
          </div>
        )}

        <button type="button" className="btn btn--primary" onClick={handleGenerate}>
          {t("dscBuilder.generate")}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {t("dscBuilder.output")}
          </h3>
          <div className="card">
            {result.fields.map((field, i) => (
              <div className="output-field" key={i}>
                <span className="output-field__label">{field.label}</span>
                <span className="output-field__value">{field.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-dim)" }}>
              {t("dscBuilder.transmitOn")}: Ch.{result.transmitChannel}
              {result.switchToChannel &&
                ` → ${t("dscBuilder.switchTo")}: Ch.${result.switchToChannel}`}
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-soft)" }}>{result.summary}</p>
        </div>
      )}
    </div>
  );
}
