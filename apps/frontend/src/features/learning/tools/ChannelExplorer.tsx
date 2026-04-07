import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../../lib/api-client.ts";
import "../../../styles/pages.css";

interface JurisdictionSummary {
  id: string;
  label: string;
}

interface ChannelDef {
  purpose: string;
  type: "voice" | "dsc_only";
  tx_allowed: boolean;
  max_power?: "low";
}

interface JurisdictionDetail {
  id: string;
  label: string;
  channelPlan: Record<string, ChannelDef>;
  callingChannel: number;
  dscChannel: number;
  notes: string;
}

interface ChannelExplorerProps {
  config?: { jurisdiction?: string };
}

export function ChannelExplorer({ config }: ChannelExplorerProps) {
  const { t } = useTranslation("tools");
  const [jurisdictions, setJurisdictions] = useState<JurisdictionSummary[]>([]);
  const [selectedId, setSelectedId] = useState(config?.jurisdiction ?? "international");
  const [detail, setDetail] = useState<JurisdictionDetail | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "voice" | "dsc_only">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<JurisdictionSummary[]>("/api/content/jurisdictions")
      .then(setJurisdictions)
      .catch(() => {
        /* jurisdictions list unavailable */
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    void apiFetch<JurisdictionDetail>(`/api/content/jurisdictions/${selectedId}`)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [selectedId]);

  const channels = detail
    ? Object.entries(detail.channelPlan)
        .filter(([, ch]) => typeFilter === "all" || ch.type === typeFilter)
        .sort(([a], [b]) => Number(a) - Number(b))
    : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t("channelExplorer.jurisdiction")}</label>
          <select
            className="form-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {jurisdictions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t("channelExplorer.type")}</label>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "voice" | "dsc_only")}
          >
            <option value="all">{t("channelExplorer.allTypes")}</option>
            <option value="voice">{t("channelExplorer.voice")}</option>
            <option value="dsc_only">{t("channelExplorer.dscOnly")}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>{t("common:loading")}</p>
      ) : channels.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>{t("channelExplorer.noChannels")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("channelExplorer.channel")}</th>
              <th>{t("channelExplorer.purpose")}</th>
              <th>{t("channelExplorer.type")}</th>
              <th>{t("channelExplorer.txAllowed")}</th>
              <th>{t("channelExplorer.maxPower")}</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(([num, ch]) => (
              <tr key={num}>
                <td style={{ fontWeight: 600 }}>Ch. {num}</td>
                <td>{ch.purpose}</td>
                <td>
                  {ch.type === "voice" ? t("channelExplorer.voice") : t("channelExplorer.dscOnly")}
                </td>
                <td>{ch.tx_allowed ? t("channelExplorer.yes") : t("channelExplorer.no")}</td>
                <td>{ch.max_power ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detail?.notes && (
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)" }}>{detail.notes}</p>
      )}
    </div>
  );
}
