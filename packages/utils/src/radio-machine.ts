import { nextChannel, prevChannel, isValidChannel } from "./channel-table.ts";
import { DSC_ONLY_CHANNEL, GUARD_CHANNELS } from "./radio-constants.ts";
import type { RadioCommand, RadioState } from "./radio-types.ts";

/** Distress auto-repeat interval range (ms). */
const DISTRESS_REPEAT_MIN_MS = 3.5 * 60 * 1000;
const DISTRESS_REPEAT_MAX_MS = 4.5 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomRepeatInterval(): number {
  return DISTRESS_REPEAT_MIN_MS + Math.random() * (DISTRESS_REPEAT_MAX_MS - DISTRESS_REPEAT_MIN_MS);
}

export const INITIAL_RADIO_STATE: RadioState = {
  channel: 16,
  power: "high",
  squelch: 4,
  volume: 75,
  dualWatch: false,
  txRx: "idle",
  dscForm: "closed",
  flipCover: "closed",
  selectedNature: null,
  distressHoldStartMs: null,
  distressRepeatTimerMs: null,
  gpsLock: true,
};

export function radioReducer(state: RadioState, command: RadioCommand): RadioState {
  switch (command.type) {
    case "SET_CHANNEL": {
      if (!isValidChannel(command.channel)) return state;
      return { ...state, channel: command.channel };
    }

    case "CHANNEL_UP":
      return { ...state, channel: nextChannel(state.channel) };

    case "CHANNEL_DOWN":
      return { ...state, channel: prevChannel(state.channel) };

    case "QUICK_16_9":
      return { ...state, channel: state.channel === 16 ? 9 : 16 };

    case "TOGGLE_DUAL_WATCH":
      return { ...state, dualWatch: !state.dualWatch };

    case "TOGGLE_POWER":
      return { ...state, power: state.power === "high" ? "low" : "high" };

    case "SET_SQUELCH":
      return { ...state, squelch: clamp(command.value, 0, 100) };

    case "SET_VOLUME":
      return { ...state, volume: clamp(command.value, 0, 100) };

    case "PRESS_PTT": {
      if (state.channel === DSC_ONLY_CHANNEL || GUARD_CHANNELS.includes(state.channel))
        return state;
      if (state.txRx !== "idle") return state;
      return { ...state, txRx: "transmitting" };
    }

    case "RELEASE_PTT": {
      if (state.txRx !== "transmitting") return state;
      return { ...state, txRx: "idle" };
    }

    case "BEGIN_RECEIVE": {
      if (state.txRx === "transmitting") return state;
      return { ...state, txRx: "receiving" };
    }

    case "END_RECEIVE": {
      if (state.txRx !== "receiving") return state;
      return { ...state, txRx: "idle" };
    }

    case "OPEN_FLIP_COVER":
      return { ...state, flipCover: "open" };

    case "CLOSE_FLIP_COVER":
      return { ...state, flipCover: "closed" };

    case "START_DISTRESS_HOLD": {
      if (state.flipCover !== "open") return state;
      if (state.dscForm === "sending") return state;
      return { ...state, distressHoldStartMs: Date.now(), dscForm: "confirming" };
    }

    case "CANCEL_DISTRESS_HOLD": {
      if (state.distressHoldStartMs === null) return state;
      return { ...state, distressHoldStartMs: null, dscForm: "closed" };
    }

    case "COMPLETE_DISTRESS_HOLD": {
      if (state.dscForm !== "confirming") return state;
      return {
        ...state,
        dscForm: "sent",
        distressHoldStartMs: null,
        channel: 16,
        txRx: "idle",
        distressRepeatTimerMs: Date.now() + randomRepeatInterval(),
      };
    }

    case "SELECT_NATURE":
      return { ...state, selectedNature: command.nature, dscForm: "nature-select" };

    case "SET_GPS_LOCK":
      return { ...state, gpsLock: command.locked };

    default:
      return state;
  }
}
