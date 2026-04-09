import { nextChannel, prevChannel, isValidChannel } from "./channel-table.ts";
import { DSC_ONLY_CHANNEL, GUARD_CHANNELS, SQUELCH_MIN, SQUELCH_MAX } from "./radio-constants.ts";
import type { NatureOfDistress } from "./dsc-types.ts";
import { natureOfDistressLabels } from "./dsc-types.ts";
import type { RadioCommand, RadioState, DscMenuScreen } from "./radio-types.ts";

/** Distress auto-repeat interval range (ms). */
const DISTRESS_REPEAT_MIN_MS = 3.5 * 60 * 1000;
const DISTRESS_REPEAT_MAX_MS = 4.5 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomRepeatInterval(): number {
  return DISTRESS_REPEAT_MIN_MS + Math.random() * (DISTRESS_REPEAT_MAX_MS - DISTRESS_REPEAT_MIN_MS);
}

// ── DSC menu item counts per screen ──

const BASE_MENU_ITEMS = ["INDIVIDUAL CALL", "ALL SHIPS", "DISTRESS SETUP", "CALL LOG"] as const;

const NO_GPS_MENU_ITEMS = [
  "INDIVIDUAL CALL",
  "ALL SHIPS",
  "DISTRESS SETUP",
  "POSITION INPUT",
  "CALL LOG",
] as const;

/** Get top-menu items — includes POSITION INPUT when GPS is not locked. */
export function getTopMenuItems(gpsLock: boolean): readonly string[] {
  return gpsLock ? BASE_MENU_ITEMS : NO_GPS_MENU_ITEMS;
}

const ALLSHIPS_CATEGORIES = ["urgency", "safety"] as const;

const NATURE_LIST: readonly NatureOfDistress[] = [
  "undesignated",
  ...(Object.keys(natureOfDistressLabels).filter(
    (k) => k !== "undesignated",
  ) as NatureOfDistress[]),
];

export { ALLSHIPS_CATEGORIES, NATURE_LIST };

export const DSC_MENU_CLOSED: DscMenuScreen = { screen: "closed" };

export const INITIAL_RADIO_STATE: RadioState = {
  channel: 16,
  power: "high",
  squelch: 4,
  volume: 75,
  dualWatch: false,
  txRx: "idle",
  dscMenu: DSC_MENU_CLOSED,
  flipCover: "closed",
  selectedNature: null,
  distressHoldStartMs: null,
  distressRepeatTimerMs: null,
  gpsLock: true,
  channelInput: "",
  manualPosition: null,
};

// ── DSC menu command handler ──

function wrapCursor(cursor: number, delta: number, count: number): number {
  return (cursor + delta + count) % count;
}

function handleDscMenuCommand(state: RadioState, command: RadioCommand): RadioState | null {
  const menu = state.dscMenu;

  switch (command.type) {
    case "OPEN_DSC_MENU": {
      if (menu.screen !== "closed") return null;
      return { ...state, dscMenu: { screen: "top-menu", cursor: 0 } };
    }

    case "DSC_MENU_UP": {
      if (menu.screen === "top-menu") {
        const items = getTopMenuItems(state.gpsLock);
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, -1, items.length) },
        };
      }
      if (menu.screen === "allships-category") {
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, -1, ALLSHIPS_CATEGORIES.length) },
        };
      }
      if (menu.screen === "distress-setup") {
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, -1, NATURE_LIST.length) },
        };
      }
      return null;
    }

    case "DSC_MENU_DOWN": {
      if (menu.screen === "top-menu") {
        const items = getTopMenuItems(state.gpsLock);
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, 1, items.length) },
        };
      }
      if (menu.screen === "allships-category") {
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, 1, ALLSHIPS_CATEGORIES.length) },
        };
      }
      if (menu.screen === "distress-setup") {
        return {
          ...state,
          dscMenu: { ...menu, cursor: wrapCursor(menu.cursor, 1, NATURE_LIST.length) },
        };
      }
      return null;
    }

    case "DSC_MENU_SELECT": {
      if (menu.screen === "top-menu") {
        const items = getTopMenuItems(state.gpsLock);
        const selected = items[menu.cursor];
        switch (selected) {
          case "INDIVIDUAL CALL":
            return { ...state, dscMenu: { screen: "individual-mmsi", buffer: "" } };
          case "ALL SHIPS":
            return { ...state, dscMenu: { screen: "allships-category", cursor: 0 } };
          case "DISTRESS SETUP":
            return { ...state, dscMenu: { screen: "distress-setup", cursor: 0 } };
          case "POSITION INPUT":
            return {
              ...state,
              dscMenu: { screen: "position-lat", buffer: "", hemisphere: "N" },
            };
          case "CALL LOG":
            return { ...state, dscMenu: { screen: "call-log" } };
          default:
            return null;
        }
      }
      if (menu.screen === "individual-mmsi") {
        if (menu.buffer.length !== 9) return null;
        return {
          ...state,
          dscMenu: { screen: "individual-channel", mmsi: menu.buffer, buffer: "" },
        };
      }
      if (menu.screen === "individual-channel") {
        const ch = Number(menu.buffer);
        if (!menu.buffer || !isValidChannel(ch)) return null;
        return {
          ...state,
          dscMenu: { screen: "individual-confirm", mmsi: menu.mmsi, channel: ch },
        };
      }
      if (menu.screen === "individual-confirm") {
        return {
          ...state,
          dscMenu: { screen: "sent", callType: "individual" },
          channel: menu.channel,
        };
      }
      if (menu.screen === "allships-category") {
        const category = ALLSHIPS_CATEGORIES[menu.cursor];
        if (!category) return null;
        return { ...state, dscMenu: { screen: "allships-channel", category, buffer: "" } };
      }
      if (menu.screen === "allships-channel") {
        const ch = Number(menu.buffer);
        if (!menu.buffer || !isValidChannel(ch)) return null;
        return {
          ...state,
          dscMenu: { screen: "allships-confirm", category: menu.category, channel: ch },
        };
      }
      if (menu.screen === "allships-confirm") {
        return {
          ...state,
          dscMenu: { screen: "sent", callType: "allships" },
          channel: menu.channel,
        };
      }
      if (menu.screen === "distress-setup") {
        const nature = NATURE_LIST[menu.cursor];
        if (!nature) return null;
        return { ...state, selectedNature: nature, dscMenu: DSC_MENU_CLOSED };
      }
      if (menu.screen === "position-lat") {
        if (menu.buffer.length < 5) return null; // DDMM.M minimum
        return {
          ...state,
          dscMenu: {
            screen: "position-lon",
            lat: menu.buffer,
            latHemi: menu.hemisphere,
            buffer: "",
            hemisphere: "E",
          },
        };
      }
      if (menu.screen === "position-lon") {
        if (menu.buffer.length < 6) return null; // DDDMM.M minimum
        return {
          ...state,
          dscMenu: {
            screen: "position-time",
            lat: menu.lat,
            latHemi: menu.latHemi,
            lon: menu.buffer,
            lonHemi: menu.hemisphere,
            buffer: "",
          },
        };
      }
      if (menu.screen === "position-time") {
        if (menu.buffer.length !== 4) return null; // HHMM
        return {
          ...state,
          dscMenu: {
            screen: "position-confirm",
            lat: menu.lat,
            latHemi: menu.latHemi,
            lon: menu.lon,
            lonHemi: menu.lonHemi,
            timeUtc: menu.buffer,
          },
        };
      }
      if (menu.screen === "position-confirm") {
        return {
          ...state,
          manualPosition: {
            lat: `${menu.lat} ${menu.latHemi}`,
            lon: `${menu.lon} ${menu.lonHemi}`,
            timeUtc: menu.timeUtc,
          },
          dscMenu: DSC_MENU_CLOSED,
        };
      }
      return null;
    }

    case "DSC_MENU_BACK": {
      if (menu.screen === "top-menu" || menu.screen === "call-log" || menu.screen === "sent") {
        return { ...state, dscMenu: DSC_MENU_CLOSED };
      }
      if (
        menu.screen === "individual-mmsi" ||
        menu.screen === "allships-category" ||
        menu.screen === "distress-setup" ||
        menu.screen === "position-lat"
      ) {
        return { ...state, dscMenu: { screen: "top-menu", cursor: 0 } };
      }
      if (menu.screen === "position-lon") {
        return {
          ...state,
          dscMenu: { screen: "position-lat", buffer: menu.lat, hemisphere: menu.latHemi },
        };
      }
      if (menu.screen === "position-time") {
        return {
          ...state,
          dscMenu: {
            screen: "position-lon",
            lat: menu.lat,
            latHemi: menu.latHemi,
            buffer: menu.lon,
            hemisphere: menu.lonHemi,
          },
        };
      }
      if (menu.screen === "position-confirm") {
        return {
          ...state,
          dscMenu: {
            screen: "position-time",
            lat: menu.lat,
            latHemi: menu.latHemi,
            lon: menu.lon,
            lonHemi: menu.lonHemi,
            buffer: menu.timeUtc,
          },
        };
      }
      if (menu.screen === "individual-channel") {
        return { ...state, dscMenu: { screen: "individual-mmsi", buffer: menu.mmsi } };
      }
      if (menu.screen === "individual-confirm") {
        return {
          ...state,
          dscMenu: {
            screen: "individual-channel",
            mmsi: menu.mmsi,
            buffer: String(menu.channel),
          },
        };
      }
      if (menu.screen === "allships-channel") {
        return { ...state, dscMenu: { screen: "allships-category", cursor: 0 } };
      }
      if (menu.screen === "allships-confirm") {
        return {
          ...state,
          dscMenu: {
            screen: "allships-channel",
            category: menu.category,
            buffer: String(menu.channel),
          },
        };
      }
      return null;
    }

    case "DSC_DIGIT": {
      if (command.digit < 0 || command.digit > 9) return null;
      // DSC menu digit entry
      if ("buffer" in menu) {
        const maxLen: Partial<Record<DscMenuScreen["screen"], number>> = {
          "individual-mmsi": 9,
          "individual-channel": 2,
          "allships-channel": 2,
          "position-lat": 7,
          "position-lon": 8,
          "position-time": 4,
        };
        const limit = maxLen[menu.screen];
        if (limit === undefined || menu.buffer.length >= limit) return null;
        return { ...state, dscMenu: { ...menu, buffer: menu.buffer + String(command.digit) } };
      }
      // Direct channel entry when menu is closed
      if (menu.screen === "closed" && state.channelInput.length < 2) {
        return { ...state, channelInput: state.channelInput + String(command.digit) };
      }
      return null;
    }

    case "DSC_BACKSPACE": {
      // DSC menu backspace
      if ("buffer" in menu && menu.buffer.length > 0) {
        return { ...state, dscMenu: { ...menu, buffer: menu.buffer.slice(0, -1) } };
      }
      // Direct channel input backspace
      if (menu.screen === "closed" && state.channelInput.length > 0) {
        return { ...state, channelInput: state.channelInput.slice(0, -1) };
      }
      return null;
    }

    case "DSC_TOGGLE_HEMISPHERE": {
      if (menu.screen === "position-lat") {
        return {
          ...state,
          dscMenu: { ...menu, hemisphere: menu.hemisphere === "N" ? "S" : "N" },
        };
      }
      if (menu.screen === "position-lon") {
        return {
          ...state,
          dscMenu: { ...menu, hemisphere: menu.hemisphere === "E" ? "W" : "E" },
        };
      }
      return null;
    }

    case "DSC_ENTER": {
      // DSC menu enter
      if ("buffer" in menu) {
        return handleDscMenuCommand(state, { type: "DSC_MENU_SELECT" });
      }
      // Direct channel entry confirm
      if (menu.screen === "closed" && state.channelInput.length > 0) {
        const ch = Number(state.channelInput);
        if (isValidChannel(ch)) {
          return { ...state, channel: ch, channelInput: "" };
        }
        return { ...state, channelInput: "" };
      }
      return null;
    }

    default:
      return null;
  }
}

export function radioReducer(state: RadioState, command: RadioCommand): RadioState {
  // Try DSC menu handler first
  const menuResult = handleDscMenuCommand(state, command);
  if (menuResult !== null) return menuResult;

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
      return { ...state, squelch: clamp(command.value, SQUELCH_MIN, SQUELCH_MAX) };

    case "SET_VOLUME":
      return { ...state, volume: clamp(command.value, 0, 100) };

    case "PRESS_PTT": {
      if (state.channel === DSC_ONLY_CHANNEL || GUARD_CHANNELS.includes(state.channel))
        return state;
      if (state.txRx !== "idle") return state;
      if (state.dscMenu.screen !== "closed") return state;
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
      if (state.dscMenu.screen === "sending") return state;
      return { ...state, distressHoldStartMs: Date.now(), dscMenu: { screen: "confirming" } };
    }

    case "CANCEL_DISTRESS_HOLD": {
      if (state.distressHoldStartMs === null) return state;
      return { ...state, distressHoldStartMs: null, dscMenu: DSC_MENU_CLOSED };
    }

    case "COMPLETE_DISTRESS_HOLD": {
      if (state.dscMenu.screen !== "confirming") return state;
      return {
        ...state,
        dscMenu: { screen: "sent", callType: "distress" },
        distressHoldStartMs: null,
        channel: 16,
        txRx: "idle",
        distressRepeatTimerMs: Date.now() + randomRepeatInterval(),
      };
    }

    case "SELECT_NATURE":
      return { ...state, selectedNature: command.nature };

    case "SET_GPS_LOCK":
      return { ...state, gpsLock: command.locked };

    case "SET_MANUAL_POSITION":
      return {
        ...state,
        manualPosition: { lat: command.lat, lon: command.lon, timeUtc: command.timeUtc },
      };

    case "CLEAR_CHANNEL_INPUT":
      return state.channelInput ? { ...state, channelInput: "" } : state;

    default:
      return state;
  }
}
