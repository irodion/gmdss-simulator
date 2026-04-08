import { useTranslation } from "react-i18next";
import {
  VALID_CHANNELS,
  channelFrequency,
  isDscOnly,
  type RadioCommand,
  type RadioState,
} from "@gmdss-simulator/utils";

const GUARD_CHANNELS = [75, 76];

interface Props {
  state: RadioState;
  onCommand: (cmd: RadioCommand) => void;
}

export function AccessibleRadioPanel({ state, onCommand }: Props) {
  const { t } = useTranslation("simulator");

  return (
    <div className="sim-a11y-panel" role="group" aria-label="Radio controls (accessible mode)">
      <div className="sim-a11y-row">
        <label className="sim-a11y-label" htmlFor="a11y-channel">
          Channel
        </label>
        <select
          id="a11y-channel"
          className="form-select"
          value={state.channel}
          onChange={(e) => onCommand({ type: "SET_CHANNEL", channel: Number(e.target.value) })}
        >
          {VALID_CHANNELS.map((ch) => {
            const label = isDscOnly(ch)
              ? "DSC ONLY"
              : GUARD_CHANNELS.includes(ch)
                ? "GUARD"
                : channelFrequency(ch);
            return (
              <option key={ch} value={ch} disabled={isDscOnly(ch) || GUARD_CHANNELS.includes(ch)}>
                Ch {ch} — {label}
              </option>
            );
          })}
        </select>
      </div>

      <div className="sim-a11y-row">
        <label className="sim-a11y-label" htmlFor="a11y-volume">
          {t("vol")} ({state.volume})
        </label>
        <input
          id="a11y-volume"
          type="range"
          className="sim-a11y-range"
          min={0}
          max={100}
          value={state.volume}
          onChange={(e) => onCommand({ type: "SET_VOLUME", value: Number(e.target.value) })}
        />
      </div>

      <div className="sim-a11y-row">
        <label className="sim-a11y-label" htmlFor="a11y-squelch">
          {t("sql")} ({state.squelch})
        </label>
        <input
          id="a11y-squelch"
          type="range"
          className="sim-a11y-range"
          min={0}
          max={100}
          value={state.squelch}
          onChange={(e) => onCommand({ type: "SET_SQUELCH", value: Number(e.target.value) })}
        />
      </div>

      <div className="sim-a11y-row">
        <label className="sim-a11y-label">
          <input
            type="checkbox"
            checked={state.dualWatch}
            onChange={() => onCommand({ type: "TOGGLE_DUAL_WATCH" })}
          />{" "}
          {t("dualWatch")}
        </label>
      </div>

      <div className="sim-a11y-row">
        <span className="sim-a11y-label">Power: {state.power === "high" ? "25W" : "1W"}</span>
        <button
          type="button"
          className="btn btn--small"
          onClick={() => onCommand({ type: "TOGGLE_POWER" })}
        >
          Toggle H/L
        </button>
      </div>

      <div className="sim-a11y-row">
        <span className="sim-a11y-label">Status:</span>
        <span role="status" aria-live="polite">
          {state.txRx === "transmitting" && (
            <strong style={{ color: "var(--error)" }}>TRANSMITTING</strong>
          )}
          {state.txRx === "receiving" && (
            <strong style={{ color: "var(--success)" }}>RECEIVING</strong>
          )}
          {state.txRx === "idle" && <span style={{ color: "var(--text-dim)" }}>Idle</span>}
        </span>
      </div>
    </div>
  );
}
