import type { NatureOfDistress } from "./dsc-types.ts";

// ── Radio state ──

export type PowerLevel = "high" | "low";

export type TxRxState = "idle" | "transmitting" | "receiving";

export type DscFormState = "closed" | "menu" | "nature-select" | "confirming" | "sending" | "sent";

export type FlipCoverState = "closed" | "open";

export interface RadioState {
  readonly channel: number; // 1–88 (valid ITU channels only)
  readonly power: PowerLevel;
  readonly squelch: number; // 0–100
  readonly volume: number; // 0–100
  readonly dualWatch: boolean;
  readonly txRx: TxRxState;
  readonly dscForm: DscFormState;
  readonly flipCover: FlipCoverState;
  readonly selectedNature: NatureOfDistress | null;
  readonly distressHoldStartMs: number | null;
  readonly distressRepeatTimerMs: number | null;
  readonly gpsLock: boolean;
}

// ── Commands (discriminated union) ──

export type RadioCommand =
  | { readonly type: "SET_CHANNEL"; readonly channel: number }
  | { readonly type: "CHANNEL_UP" }
  | { readonly type: "CHANNEL_DOWN" }
  | { readonly type: "QUICK_16_9" }
  | { readonly type: "TOGGLE_DUAL_WATCH" }
  | { readonly type: "TOGGLE_POWER" }
  | { readonly type: "SET_SQUELCH"; readonly value: number }
  | { readonly type: "SET_VOLUME"; readonly value: number }
  | { readonly type: "PRESS_PTT" }
  | { readonly type: "RELEASE_PTT" }
  | { readonly type: "OPEN_FLIP_COVER" }
  | { readonly type: "CLOSE_FLIP_COVER" }
  | { readonly type: "START_DISTRESS_HOLD" }
  | { readonly type: "CANCEL_DISTRESS_HOLD" }
  | { readonly type: "COMPLETE_DISTRESS_HOLD" }
  | { readonly type: "SELECT_NATURE"; readonly nature: NatureOfDistress }
  | { readonly type: "BEGIN_RECEIVE" }
  | { readonly type: "END_RECEIVE" }
  | { readonly type: "SET_GPS_LOCK"; readonly locked: boolean };

// ── Event sourcing ──

export interface RadioEvent {
  readonly timestamp: number;
  readonly command: RadioCommand;
  readonly prevState: RadioState;
  readonly nextState: RadioState;
}
