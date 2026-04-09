import { useTranslation } from "react-i18next";
import {
  VALID_CHANNELS,
  channelFrequency,
  isDscOnly,
  isDscMenuOpen,
  displayLines,
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
          max={9}
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

      <hr className="sim-a11y-divider" />

      <div className="sim-a11y-row">
        <span className="sim-a11y-label">DSC Menu:</span>
        <div className="sim-a11y-btngroup">
          <button
            type="button"
            className="btn btn--small"
            onClick={() =>
              onCommand({
                type: isDscMenuOpen(state) ? "DSC_MENU_BACK" : "OPEN_DSC_MENU",
              })
            }
          >
            {isDscMenuOpen(state) ? "Back" : "Menu"}
          </button>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onCommand({ type: "DSC_MENU_SELECT" })}
          >
            Select
          </button>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onCommand({ type: "DSC_MENU_UP" })}
          >
            ▲
          </button>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onCommand({ type: "DSC_MENU_DOWN" })}
          >
            ▼
          </button>
        </div>
      </div>

      {isDscMenuOpen(state) && (
        <div className="sim-a11y-row" role="status" aria-live="polite">
          <span className="sim-a11y-label">Screen:</span>
          <span className="sim-a11y-mono">{displayLines(state).sub}</span>
        </div>
      )}

      <div className="sim-a11y-row">
        <label className="sim-a11y-label" htmlFor="a11y-digit">
          Keypad:
        </label>
        <div className="sim-a11y-btngroup sim-a11y-btngroup--wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
            <button
              key={d}
              type="button"
              className="btn btn--small sim-a11y-digit"
              onClick={() => onCommand({ type: "DSC_DIGIT", digit: d })}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onCommand({ type: "DSC_BACKSPACE" })}
          >
            DEL
          </button>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onCommand({ type: "DSC_ENTER" })}
          >
            ENT
          </button>
        </div>
      </div>
    </div>
  );
}
