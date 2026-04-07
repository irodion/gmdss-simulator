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
  notes: string | null;
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
    let cancelled = false;
    setDetail(null);
    setLoading(true);
    void apiFetch<JurisdictionDetail>(`/api/content/jurisdictions/${selectedId}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const channels = detail
    ? Object.entries(detail.channelPlan)
        .filter(([, ch]) => typeFilter === "all" || ch.type === typeFilter)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="ce-jurisdiction" className="form-label">
            {t("channelExplorer.jurisdiction")}
          </label>
          <select
            id="ce-jurisdiction"
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
          <label htmlFor="ce-type-filter" className="form-label">
            {t("channelExplorer.type")}
          </label>
          <select
            id="ce-type-filter"
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
              <th scope="col">{t("channelExplorer.channel")}</th>
              <th scope="col">{t("channelExplorer.purpose")}</th>
              <th scope="col">{t("channelExplorer.type")}</th>
              <th scope="col">{t("channelExplorer.txAllowed")}</th>
              <th scope="col">{t("channelExplorer.maxPower")}</th>
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
