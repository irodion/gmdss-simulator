import { channelFrequency } from "./channel-table.ts";
import { DSC_ONLY_CHANNEL, GUARD_CHANNELS } from "./radio-constants.ts";
import { natureOfDistressLabels } from "./dsc-types.ts";
import { getTopMenuItems, ALLSHIPS_CATEGORIES, NATURE_LIST } from "./radio-machine.ts";
import type { RadioState } from "./radio-types.ts";

export interface DisplayLines {
  /** e.g. "CH 16  156.800" */
  readonly main: string;
  /** e.g. "DUAL WATCH: OFF" */
  readonly sub: string;
  /** e.g. "PWR 25W  SQL 4  GPS LOCK" */
  readonly footer: string;
}

/**
 * Render DSC menu screen content for the LCD.
 * Returns null when the menu is closed (normal display).
 */
function dscMenuLines(state: RadioState): DisplayLines | null {
  const menu = state.dscMenu;
  if (menu.screen === "closed") return null;

  switch (menu.screen) {
    case "top-menu": {
      const items = getTopMenuItems(state.gpsLock);
      const item = items[menu.cursor] ?? "";
      return {
        main: "DSC MENU",
        sub: `> ${item}`,
        footer: "CH=NAV  CALL=SEL  MENU=BACK",
      };
    }

    case "individual-mmsi": {
      const display = menu.buffer + "_".repeat(9 - menu.buffer.length);
      return {
        main: "ENTER MMSI",
        sub: display,
        footer: `${menu.buffer.length}/9 DIGITS`,
      };
    }

    case "individual-channel": {
      const display = menu.buffer || "__";
      return {
        main: `MMSI ${menu.mmsi}`,
        sub: `WORK CH: ${display}`,
        footer: "ENTER CHANNEL NUMBER",
      };
    }

    case "individual-confirm":
      return {
        main: `CALL ${menu.mmsi}`,
        sub: `CH ${String(menu.channel).padStart(2, "0")}`,
        footer: "CALL=SEND  MENU=BACK",
      };

    case "allships-category": {
      const cat = ALLSHIPS_CATEGORIES[menu.cursor] ?? "";
      return {
        main: "ALL SHIPS",
        sub: `> ${cat.toUpperCase()}`,
        footer: "CH=NAV  CALL=SEL",
      };
    }

    case "allships-channel": {
      const display = menu.buffer || "__";
      return {
        main: `ALL SHIPS ${menu.category.toUpperCase()}`,
        sub: `WORK CH: ${display}`,
        footer: "ENTER CHANNEL NUMBER",
      };
    }

    case "allships-confirm":
      return {
        main: `ALL SHIPS ${menu.category.toUpperCase()}`,
        sub: `CH ${String(menu.channel).padStart(2, "0")}`,
        footer: "CALL=SEND  MENU=BACK",
      };

    case "distress-setup": {
      const nature = NATURE_LIST[menu.cursor];
      const label = nature ? natureOfDistressLabels[nature] : "";
      return {
        main: "DISTRESS NATURE",
        sub: `> ${label}`,
        footer: "CH=NAV  CALL=SEL",
      };
    }

    case "position-lat": {
      const display = menu.buffer || "_______";
      return {
        main: `LATITUDE  ${menu.hemisphere}`,
        sub: display,
        footer: "DDMM.MMM  CALL=N/S",
      };
    }

    case "position-lon": {
      const display = menu.buffer || "________";
      return {
        main: `LONGITUDE  ${menu.hemisphere}`,
        sub: display,
        footer: "DDDMM.MMM  CALL=E/W",
      };
    }

    case "position-time": {
      const display = menu.buffer + "_".repeat(4 - menu.buffer.length);
      return {
        main: "UTC TIME",
        sub: display,
        footer: "HHMM",
      };
    }

    case "position-confirm":
      return {
        main: `${menu.lat} ${menu.latHemi}`,
        sub: `${menu.lon} ${menu.lonHemi}  ${menu.timeUtc}Z`,
        footer: "CALL=SAVE  MENU=BACK",
      };

    case "call-log":
      return {
        main: "CALL LOG",
        sub: "NO ENTRIES",
        footer: "MENU=BACK",
      };

    case "sending":
      return {
        main: "SENDING DSC...",
        sub: "CH 70",
        footer: "PLEASE WAIT",
      };

    case "sent":
      return {
        main: `${menu.callType.toUpperCase()} SENT`,
        sub: "DSC TRANSMITTED",
        footer: "MENU=CLOSE",
      };

    case "confirming":
      return {
        main: "DISTRESS ALERT",
        sub: "HOLD BUTTON...",
        footer: "RELEASE TO CANCEL",
      };
  }
}

/**
 * Derive the three LCD display lines from radio state.
 */
export function displayLines(state: RadioState): DisplayLines {
  const menuLines = dscMenuLines(state);
  if (menuLines) return menuLines;

  const freq = channelFrequency(state.channel);
  const chStr = String(state.channel).padStart(2, "0");

  const main =
    state.channel === DSC_ONLY_CHANNEL ? `CH ${chStr}  DSC ONLY` : `CH ${chStr}  ${freq}`;
  const sub = state.channelInput
    ? `GO TO CH: ${state.channelInput}_`
    : state.dualWatch
      ? "DUAL WATCH: CH 16"
      : "DUAL WATCH: OFF";

  const pwr = state.power === "high" ? "25W" : "1W";
  const sql = String(state.squelch);
  const gps = state.gpsLock ? "GPS LOCK" : state.manualPosition ? "MAN POS" : "NO GPS";
  const footer = `PWR ${pwr}  SQL ${sql}  ${gps}`;

  return { main, sub, footer };
}

/**
 * Whether voice transmission is blocked on the current channel.
 */
export function isVoiceBlocked(state: RadioState): boolean {
  return state.channel === DSC_ONLY_CHANNEL || GUARD_CHANNELS.includes(state.channel);
}

/**
 * Whether the given channel is DSC-only (no voice).
 */
export function isDscOnly(channel: number): boolean {
  return channel === DSC_ONLY_CHANNEL;
}

/** Whether the DSC menu is currently open (any screen other than closed). */
export function isDscMenuOpen(state: RadioState): boolean {
  return state.dscMenu.screen !== "closed";
}

const DIGIT_SCREENS = new Set([
  "individual-mmsi",
  "individual-channel",
  "allships-channel",
  "position-lat",
  "position-lon",
  "position-time",
]);

/** Whether the current DSC screen accepts numeric keypad input. */
export function isDscDigitScreen(state: RadioState): boolean {
  return DIGIT_SCREENS.has(state.dscMenu.screen);
}

export { channelFrequency } from "./channel-table.ts";
