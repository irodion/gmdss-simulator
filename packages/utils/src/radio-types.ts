import type { NatureOfDistress } from "./dsc-types.ts";

// ── Radio state ──

export type PowerLevel = "high" | "low";

export type TxRxState = "idle" | "transmitting" | "receiving";

export type FlipCoverState = "closed" | "open";

/** DSC menu state — discriminated union representing every screen. */
export type DscMenuScreen =
  | { readonly screen: "closed" }
  | { readonly screen: "top-menu"; readonly cursor: number }
  | { readonly screen: "individual-mmsi"; readonly buffer: string }
  | { readonly screen: "individual-channel"; readonly mmsi: string; readonly buffer: string }
  | { readonly screen: "individual-confirm"; readonly mmsi: string; readonly channel: number }
  | { readonly screen: "allships-category"; readonly cursor: number }
  | {
      readonly screen: "allships-channel";
      readonly category: "urgency" | "safety";
      readonly buffer: string;
    }
  | {
      readonly screen: "allships-confirm";
      readonly category: "urgency" | "safety";
      readonly channel: number;
    }
  | { readonly screen: "distress-setup"; readonly cursor: number }
  | { readonly screen: "position-lat"; readonly buffer: string; readonly hemisphere: "N" | "S" }
  | {
      readonly screen: "position-lon";
      readonly lat: string;
      readonly latHemi: "N" | "S";
      readonly buffer: string;
      readonly hemisphere: "E" | "W";
    }
  | {
      readonly screen: "position-time";
      readonly lat: string;
      readonly latHemi: "N" | "S";
      readonly lon: string;
      readonly lonHemi: "E" | "W";
      readonly buffer: string;
    }
  | {
      readonly screen: "position-confirm";
      readonly lat: string;
      readonly latHemi: "N" | "S";
      readonly lon: string;
      readonly lonHemi: "E" | "W";
      readonly timeUtc: string;
    }
  | { readonly screen: "call-log" }
  | { readonly screen: "sending" }
  | { readonly screen: "sent"; readonly callType: "individual" | "allships" | "distress" }
  | { readonly screen: "confirming" };

export interface RadioState {
  readonly channel: number; // 1–88 (valid ITU channels only)
  readonly power: PowerLevel;
  readonly squelch: number; // 0–9
  readonly volume: number; // 0–100
  readonly dualWatch: boolean;
  readonly txRx: TxRxState;
  readonly dscMenu: DscMenuScreen;
  readonly flipCover: FlipCoverState;
  readonly selectedNature: NatureOfDistress | null;
  readonly distressHoldStartMs: number | null;
  readonly distressRepeatTimerMs: number | null;
  readonly distressAlertSentAt: number | null;
  readonly distressAlertNature: NatureOfDistress | null;
  readonly gpsLock: boolean;
  readonly channelInput: string;
  readonly manualPosition: {
    readonly lat: string;
    readonly lon: string;
    readonly timeUtc: string;
  } | null;
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
  | { readonly type: "SET_GPS_LOCK"; readonly locked: boolean }
  // DSC menu commands
  | { readonly type: "OPEN_DSC_MENU" }
  | { readonly type: "DSC_MENU_UP" }
  | { readonly type: "DSC_MENU_DOWN" }
  | { readonly type: "DSC_MENU_SELECT" }
  | { readonly type: "DSC_MENU_BACK" }
  | { readonly type: "DSC_DIGIT"; readonly digit: number }
  | { readonly type: "DSC_BACKSPACE" }
  | { readonly type: "DSC_ENTER" }
  | { readonly type: "DSC_TOGGLE_HEMISPHERE" }
  | { readonly type: "CLEAR_CHANNEL_INPUT" }
  | {
      readonly type: "SET_MANUAL_POSITION";
      readonly lat: string;
      readonly lon: string;
      readonly timeUtc: string;
    };

// ── Event sourcing ──

export interface RadioEvent {
  readonly timestamp: number;
  readonly command: RadioCommand;
  readonly prevState: RadioState;
  readonly nextState: RadioState;
}
