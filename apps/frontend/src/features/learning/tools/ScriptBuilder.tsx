import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  buildMaydayScript,
  buildPanPanScript,
  buildSecuriteScript,
  buildMedicoScript,
} from "@gmdss-simulator/utils";
import type { ScriptType } from "@gmdss-simulator/utils";
import "../../../styles/pages.css";

interface ScriptBuilderProps {
  config?: { scriptType?: string };
}

const scriptTypes: ScriptType[] = ["mayday", "pan-pan", "securite", "medico"];

export function ScriptBuilder({ config }: ScriptBuilderProps) {
  const { t } = useTranslation("tools");
  const initialType = scriptTypes.includes(config?.scriptType as ScriptType)
    ? (config!.scriptType as ScriptType)
    : "mayday";
  const [scriptType, setScriptType] = useState<ScriptType>(initialType);
  const [vesselName, setVesselName] = useState("");
  const [callsign, setCallsign] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [position, setPosition] = useState("");
  const [natureOfDistress, setNatureOfDistress] = useState("");
  const [assistanceRequired, setAssistanceRequired] = useState("");
  const [personsOnBoard, setPersonsOnBoard] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [natureOfUrgency, setNatureOfUrgency] = useState("");
  const [stationName, setStationName] = useState("");
  const [infoChannel, setInfoChannel] = useState("");
  const [natureOfSafety, setNatureOfSafety] = useState("");
  const [details, setDetails] = useState("");
  const [patientDetails, setPatientDetails] = useState("");
  const [addressee, setAddressee] = useState("");
  const [output, setOutput] = useState("");

  function handleGenerate() {
    let script = "";
    switch (scriptType) {
      case "mayday":
        script = buildMaydayScript({
          vesselName,
          callsign: callsign || undefined,
          mmsi: mmsi || undefined,
          position,
          natureOfDistress,
          assistanceRequired,
          personsOnBoard: Number(personsOnBoard) || 0,
          additionalInfo: additionalInfo || undefined,
        });
        break;
      case "pan-pan":
        script = buildPanPanScript({
          vesselName,
          callsign: callsign || undefined,
          mmsi: mmsi || undefined,
          position,
          natureOfUrgency,
          assistanceRequired: assistanceRequired || undefined,
          personsOnBoard: personsOnBoard ? Number(personsOnBoard) : undefined,
          additionalInfo: additionalInfo || undefined,
        });
        break;
      case "securite":
        script = buildSecuriteScript({
          stationName,
          infoChannel: infoChannel ? Number(infoChannel) : undefined,
          natureOfSafety,
          details,
        });
        break;
      case "medico":
        script = buildMedicoScript({
          vesselName,
          callsign: callsign || undefined,
          mmsi: mmsi || undefined,
          position,
          patientDetails,
          assistanceRequired,
          addressee: addressee || undefined,
        });
        break;
    }
    setOutput(script);
  }

  const showVesselFields = scriptType !== "securite";
  const showStationFields = scriptType === "securite";

  return (
    <div>
      <div className="tabs">
        {scriptTypes.map((st) => (
          <button
            key={st}
            type="button"
            className={`tab${scriptType === st ? " tab--active" : ""}`}
            onClick={() => {
              setScriptType(st);
              setOutput("");
              setVesselName("");
              setCallsign("");
              setMmsi("");
              setPosition("");
              setNatureOfDistress("");
              setAssistanceRequired("");
              setPersonsOnBoard("");
              setAdditionalInfo("");
              setNatureOfUrgency("");
              setStationName("");
              setInfoChannel("");
              setNatureOfSafety("");
              setDetails("");
              setPatientDetails("");
              setAddressee("");
            }}
          >
            {t(`scriptBuilder.${st === "pan-pan" ? "panpan" : st}`)}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 500 }}>
        {showVesselFields && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.vesselName")}</label>
              <input
                className="form-input"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("scriptBuilder.callsign")}</label>
                <input
                  className="form-input"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("scriptBuilder.mmsi")}</label>
                <input
                  className="form-input"
                  value={mmsi}
                  onChange={(e) => setMmsi(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.position")}</label>
              <input
                className="form-input"
                placeholder="36°08'N 005°21'W"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </>
        )}

        {showStationFields && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.stationName")}</label>
              <input
                className="form-input"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.infoChannel")}</label>
              <input
                className="form-input"
                type="number"
                value={infoChannel}
                onChange={(e) => setInfoChannel(e.target.value)}
              />
            </div>
          </>
        )}

        {scriptType === "mayday" && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.natureOfDistress")}</label>
              <input
                className="form-input"
                placeholder="on fire and taking on water"
                value={natureOfDistress}
                onChange={(e) => setNatureOfDistress(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.assistanceRequired")}</label>
              <input
                className="form-input"
                value={assistanceRequired}
                onChange={(e) => setAssistanceRequired(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("scriptBuilder.personsOnBoard")}</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={personsOnBoard}
                  onChange={(e) => setPersonsOnBoard(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("scriptBuilder.additionalInfo")}</label>
                <input
                  className="form-input"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {scriptType === "pan-pan" && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.natureOfUrgency")}</label>
              <input
                className="form-input"
                value={natureOfUrgency}
                onChange={(e) => setNatureOfUrgency(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.assistanceRequired")}</label>
              <input
                className="form-input"
                value={assistanceRequired}
                onChange={(e) => setAssistanceRequired(e.target.value)}
              />
            </div>
          </>
        )}

        {scriptType === "securite" && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.natureOfSafety")}</label>
              <input
                className="form-input"
                value={natureOfSafety}
                onChange={(e) => setNatureOfSafety(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.details")}</label>
              <input
                className="form-input"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </>
        )}

        {scriptType === "medico" && (
          <>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.addressee")}</label>
              <input
                className="form-input"
                placeholder="ALL STATIONS"
                value={addressee}
                onChange={(e) => setAddressee(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.patientDetails")}</label>
              <input
                className="form-input"
                value={patientDetails}
                onChange={(e) => setPatientDetails(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("scriptBuilder.assistanceRequired")}</label>
              <input
                className="form-input"
                value={assistanceRequired}
                onChange={(e) => setAssistanceRequired(e.target.value)}
              />
            </div>
          </>
        )}

        <button type="button" className="btn btn--primary" onClick={handleGenerate}>
          {t("scriptBuilder.generate")}
        </button>
      </div>

      {output && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {t("scriptBuilder.output")}
          </h3>
          <div className="output-block">{output}</div>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)" }}>
            {t("scriptBuilder.copyHint")}
          </p>
        </div>
      )}
    </div>
  );
}
