import {
  natureOfDistressLabels,
  ROC_NATURE_CODES,
  type NatureOfDistress,
} from "@gmdss-simulator/utils";
import type { ReactNode } from "react";
import { buildChannelAck } from "../drills/scripts/channel-ack.ts";
import { COAST_STATIONS } from "../drills/scripts/coast-stations.ts";
import type {
  CallPriority,
  DscCallType,
  DscPanelState,
  DscPower,
  ProcedureGrade,
} from "../drills/scripts/types.ts";

/**
 * The voice working channels the trainee can propose. A fixed list (Ch 16 plus
 * common ship-to-ship / port working channels, incl. Ch 26 for coast-station
 * traffic) doubles as the distractor set, replacing the old per-rubric
 * channel-power decoy pools.
 */
export const CHANNEL_OPTIONS: readonly number[] = [6, 8, 12, 13, 16, 26, 72, 77];

const CALL_TYPES: readonly { id: DscCallType; label: string }[] = [
  { id: "distress", label: "Distress" },
  { id: "individual", label: "Individual" },
  { id: "all_ships", label: "All Ships" },
];

const PRIORITIES: readonly { id: CallPriority; label: string }[] = [
  { id: "routine", label: "Routine" },
  { id: "safety", label: "Safety" },
  { id: "urgency", label: "Urgency" },
];

export const INITIAL_PANEL_STATE: DscPanelState = {
  epirb: false,
  spareAntenna: false,
  abandon: false,
  power: "high",
  channel: null,
  dscActivated: false,
  callType: null,
  nature: null,
  priority: null,
  addressee: null,
};

interface DscPanelProps {
  readonly state: DscPanelState;
  readonly onChange: (next: DscPanelState) => void;
  /** After Submit the panel is read-only. */
  readonly locked: boolean;
  /** Per-field grade shown beneath the panel after Submit. */
  readonly result?: ProcedureGrade | null;
}

export function DscPanel({ state, onChange, locked, result }: DscPanelProps) {
  function set(patch: Partial<DscPanelState>) {
    if (locked) return;
    onChange({ ...state, ...patch });
  }

  // Editing the call configuration is locked once the alert is "sent"; Cancel
  // reverts it so the trainee can correct a mistake before Submit.
  const callLocked = locked || state.dscActivated;
  // Send is enabled once the call is fully specified: a Distress needs a nature,
  // an All Ships needs a precedence, an Individual needs precedence + addressee +
  // a proposed working channel (the station echoes it in its acknowledgement).
  const canActivate =
    !locked &&
    !state.dscActivated &&
    state.callType !== null &&
    (state.callType === "distress"
      ? state.nature !== null
      : state.callType === "individual"
        ? state.priority !== null && state.addressee !== null && state.channel !== null
        : state.priority !== null);

  const channelAck = buildChannelAck(state);

  return (
    <section className="dsc-panel" aria-label="DSC and equipment controls">
      <div className="dsc-panel-head">
        <span className="dsc-panel-eyebrow">DSC &amp; Equipment</span>
        <span className="dsc-panel-sub">Set the controls, then send the alert.</span>
      </div>

      <Group label="Equipment">
        <div className="dsc-equip" role="group" aria-label="Equipment">
          <Toggle
            label="EPIRB"
            pressed={state.epirb}
            disabled={locked}
            onToggle={() => set({ epirb: !state.epirb })}
          />
          <Toggle
            label="Spare antenna"
            pressed={state.spareAntenna}
            disabled={locked}
            onToggle={() => set({ spareAntenna: !state.spareAntenna })}
          />
          <Toggle
            label="Grab-bag to liferaft"
            pressed={state.abandon}
            disabled={locked}
            onToggle={() => set({ abandon: !state.abandon })}
          />
        </div>
      </Group>

      <Group label="DSC call">
        <div className="dsc-opts" role="group" aria-label="DSC call type">
          {CALL_TYPES.map((ct) => (
            <Opt
              key={ct.id}
              pressed={state.callType === ct.id}
              disabled={callLocked}
              onClick={() =>
                set({ callType: ct.id, nature: null, priority: null, addressee: null })
              }
            >
              {ct.label}
            </Opt>
          ))}
        </div>

        {state.callType === "distress" ? (
          <div className="dsc-sub">
            <span className="dsc-sub-label">Nature of distress</span>
            <div className="dsc-opts dsc-opts-wrap" role="group" aria-label="Nature of distress">
              {ROC_NATURE_CODES.map((code) => (
                <Opt
                  key={code}
                  pressed={state.nature === code}
                  disabled={callLocked}
                  onClick={() => set({ nature: code as NatureOfDistress })}
                >
                  {natureOfDistressLabels[code]}
                </Opt>
              ))}
            </div>
          </div>
        ) : null}

        {state.callType === "individual" || state.callType === "all_ships" ? (
          <div className="dsc-sub">
            <span className="dsc-sub-label">Priority</span>
            <div className="dsc-opts" role="group" aria-label="Call priority">
              {PRIORITIES.map((p) => (
                <Opt
                  key={p.id}
                  pressed={state.priority === p.id}
                  disabled={callLocked}
                  onClick={() => set({ priority: p.id })}
                >
                  {p.label}
                </Opt>
              ))}
            </div>
          </div>
        ) : null}

        {state.callType === "individual" ? (
          <div className="dsc-sub">
            <span className="dsc-sub-label">Addressee (coast station)</span>
            <div
              className="dsc-opts dsc-opts-wrap"
              role="group"
              aria-label="Addressee coast station"
            >
              {COAST_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  className="dsc-opt dsc-opt-station"
                  aria-pressed={state.addressee === station.id}
                  aria-label={`${station.name}, MMSI ${station.mmsi}`}
                  disabled={callLocked}
                  onClick={() => set({ addressee: station.id })}
                >
                  <span className="dsc-station-name">{station.name}</span>
                  <span className="dsc-station-mmsi">{station.mmsi}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {state.dscActivated ? (
          <div className="dsc-ack" role="status">
            <span className="dsc-ack-mark" aria-hidden="true" />
            <span className="dsc-ack-text">
              {state.callType === "individual"
                ? (channelAck ?? "Call sent.")
                : state.callType === "all_ships"
                  ? "All Ships call transmitted on Channel 70."
                  : "Distress alert transmitted on Channel 70."}
            </span>
            {!locked ? (
              <button
                type="button"
                className="dsc-cancel"
                onClick={() => set({ dscActivated: false })}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary dsc-send"
            disabled={!canActivate}
            onClick={() => set({ dscActivated: true })}
          >
            Send DSC alert
          </button>
        )}
      </Group>

      <Group label="Working channel">
        <div className="dsc-opts dsc-opts-wrap" role="group" aria-label="Working channel">
          {CHANNEL_OPTIONS.map((ch) => (
            <Opt
              key={ch}
              pressed={state.channel === ch}
              disabled={locked}
              ariaLabel={`Channel ${ch}`}
              onClick={() => set({ channel: ch })}
            >
              {ch}
            </Opt>
          ))}
        </div>
      </Group>

      <Group label="Transmit power">
        <div className="dsc-opts" role="group" aria-label="Transmit power">
          {(["high", "low"] as DscPower[]).map((p) => (
            <Opt
              key={p}
              pressed={state.power === p}
              disabled={locked}
              onClick={() => set({ power: p })}
            >
              {p === "high" ? "High 25 W" : "Low 1 W"}
            </Opt>
          ))}
        </div>
      </Group>

      {locked && result ? (
        <ul className="dsc-feedback" aria-label="DSC and equipment feedback">
          {result.fields.map((f) => (
            <li key={f.id} className="dsc-feedback-row" data-correct={f.correct ? "true" : "false"}>
              <span className="dsc-feedback-mark" aria-hidden="true">
                {f.correct ? "✓" : "✗"}
              </span>
              <span className="dsc-feedback-label">{f.label}</span>
              <span className="dsc-feedback-detail">{f.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Group({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="dsc-group">
      <span className="dsc-group-label">{label}</span>
      {children}
    </div>
  );
}

interface OptProps {
  readonly pressed: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly ariaLabel?: string;
  readonly children: ReactNode;
}

function Opt({ pressed, disabled, onClick, ariaLabel, children }: OptProps) {
  return (
    <button
      type="button"
      className="dsc-opt"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ToggleProps {
  readonly label: string;
  readonly pressed: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}

function Toggle({ label, pressed, disabled, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      className="dsc-toggle"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="dsc-toggle-mark" aria-hidden="true" />
      <span className="dsc-toggle-text">{label}</span>
      <span className="dsc-toggle-state" aria-hidden="true">
        {pressed ? "ON" : "OFF"}
      </span>
    </button>
  );
}
