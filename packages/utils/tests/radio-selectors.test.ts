import { describe, expect, it } from "vite-plus/test";
import {
  displayLines,
  isVoiceBlocked,
  isDscOnly,
  isDscMenuOpen,
  isDscDigitScreen,
} from "../src/radio-selectors.ts";
import { squelchToPercent } from "../src/radio-constants.ts";
import {
  channelFrequency,
  isValidChannel,
  nextChannel,
  prevChannel,
  VALID_CHANNELS,
} from "../src/channel-table.ts";
import { INITIAL_RADIO_STATE } from "../src/radio-machine.ts";
import type { RadioState } from "../src/radio-types.ts";

describe("channelFrequency", () => {
  it("returns 156.800 for channel 16", () => {
    expect(channelFrequency(16)).toBe("156.800");
  });

  it("returns 156.450 for channel 9", () => {
    expect(channelFrequency(9)).toBe("156.450");
  });

  it("returns 156.525 for channel 70 (DSC)", () => {
    expect(channelFrequency(70)).toBe("156.525");
  });

  it("returns 156.050 for channel 1", () => {
    expect(channelFrequency(1)).toBe("156.050");
  });

  it("returns 157.425 for channel 88", () => {
    expect(channelFrequency(88)).toBe("157.425");
  });

  it("returns --- for invalid channel", () => {
    expect(channelFrequency(30)).toBe("---");
    expect(channelFrequency(0)).toBe("---");
    expect(channelFrequency(99)).toBe("---");
  });
});

describe("isValidChannel", () => {
  it("returns true for valid channels", () => {
    expect(isValidChannel(1)).toBe(true);
    expect(isValidChannel(16)).toBe(true);
    expect(isValidChannel(70)).toBe(true);
    expect(isValidChannel(88)).toBe(true);
  });

  it("returns false for gaps in ITU table", () => {
    expect(isValidChannel(29)).toBe(false);
    expect(isValidChannel(30)).toBe(false);
    expect(isValidChannel(59)).toBe(false);
  });

  it("returns false for out of range", () => {
    expect(isValidChannel(0)).toBe(false);
    expect(isValidChannel(89)).toBe(false);
    expect(isValidChannel(-1)).toBe(false);
  });
});

describe("nextChannel / prevChannel", () => {
  it("moves forward through valid channels", () => {
    expect(nextChannel(16)).toBe(17);
    expect(nextChannel(28)).toBe(60); // skip gap
  });

  it("wraps from last to first", () => {
    expect(nextChannel(88)).toBe(1);
  });

  it("moves backward through valid channels", () => {
    expect(prevChannel(17)).toBe(16);
    expect(prevChannel(60)).toBe(28); // skip gap
  });

  it("wraps from first to last", () => {
    expect(prevChannel(1)).toBe(88);
  });

  it("handles unknown channel by returning first/last", () => {
    expect(nextChannel(30)).toBe(VALID_CHANNELS[0]);
    expect(prevChannel(30)).toBe(VALID_CHANNELS[VALID_CHANNELS.length - 1]);
  });
});

describe("displayLines", () => {
  it("formats initial state correctly", () => {
    const lines = displayLines(INITIAL_RADIO_STATE);
    expect(lines.main).toBe("CH 16  156.800");
    expect(lines.sub).toBe("DUAL WATCH: OFF");
    expect(lines.footer).toBe("PWR 25W  SQL 4  GPS LOCK");
  });

  it("shows dual watch when enabled", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, dualWatch: true };
    expect(displayLines(state).sub).toBe("DUAL WATCH: CH 16");
  });

  it("shows low power", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, power: "low" };
    expect(displayLines(state).footer).toContain("PWR 1W");
  });

  it("shows squelch level", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, squelch: 7 };
    expect(displayLines(state).footer).toContain("SQL 7");
  });

  it("shows NO GPS when not locked", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, gpsLock: false };
    expect(displayLines(state).footer).toContain("NO GPS");
  });

  it("pads single-digit channels", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 6 };
    expect(displayLines(state).main).toBe("CH 06  156.300");
  });

  it("shows DSC ONLY on channel 70", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 70 };
    expect(displayLines(state).main).toBe("CH 70  DSC ONLY");
  });

  it("shows DSC menu top-menu screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "top-menu", cursor: 0 },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("DSC MENU");
    expect(lines.sub).toBe("> INDIVIDUAL CALL");
  });

  it("shows MMSI entry screen with buffer", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "individual-mmsi", buffer: "211" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("ENTER MMSI");
    expect(lines.sub).toBe("211______");
    expect(lines.footer).toBe("3/9 DIGITS");
  });

  it("shows individual confirm screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "individual-confirm", mmsi: "211239680", channel: 6 },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("CALL 211239680");
    expect(lines.sub).toBe("CH 06");
  });

  it("shows distress confirming screen during hold", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "confirming" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("DISTRESS ALERT");
  });

  it("shows sent screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "sent", callType: "distress" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("DISTRESS SENT");
  });

  it("shows position lat entry screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "position-lat", buffer: "5130", hemisphere: "N" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("LATITUDE  N");
    expect(lines.sub).toBe("5130");
  });

  it("shows MAN POS in footer when manual position set", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      gpsLock: false,
      manualPosition: { lat: "5130.5 N", lon: "00007.5 W", timeUtc: "1430" },
    };
    const lines = displayLines(state);
    expect(lines.footer).toContain("MAN POS");
  });

  it("shows POSITION INPUT in menu when GPS unlocked", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      gpsLock: false,
      dscMenu: { screen: "top-menu", cursor: 3 },
    };
    const lines = displayLines(state);
    expect(lines.sub).toBe("> POSITION INPUT");
  });

  it("shows channel input when typing", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "1" };
    const lines = displayLines(state);
    expect(lines.sub).toBe("GO TO CH: 1_");
  });

  it("shows individual-channel screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "individual-channel", mmsi: "211239680", buffer: "06" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("MMSI 211239680");
    expect(lines.sub).toBe("WORK CH: 06");
  });

  it("shows allships-category screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "allships-category", cursor: 0 },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("ALL SHIPS");
    expect(lines.sub).toBe("> URGENCY");
  });

  it("shows allships-channel screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "allships-channel", category: "safety", buffer: "16" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("ALL SHIPS SAFETY");
    expect(lines.sub).toBe("WORK CH: 16");
  });

  it("shows allships-confirm screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "allships-confirm", category: "urgency", channel: 16 },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("ALL SHIPS URGENCY");
    expect(lines.sub).toBe("CH 16");
  });

  it("shows distress-setup screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "distress-setup", cursor: 0 },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("DISTRESS NATURE");
    expect(lines.sub).toContain(">");
  });

  it("shows position-lon screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: {
        screen: "position-lon",
        lat: "5130",
        latHemi: "N",
        buffer: "000",
        hemisphere: "W",
      },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("LONGITUDE  W");
    expect(lines.sub).toBe("000");
  });

  it("shows position-time screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: {
        screen: "position-time",
        lat: "5130",
        latHemi: "N",
        lon: "00007",
        lonHemi: "W",
        buffer: "14",
      },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("UTC TIME");
    expect(lines.sub).toBe("14__");
  });

  it("shows position-confirm screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: {
        screen: "position-confirm",
        lat: "5130",
        latHemi: "N",
        lon: "00007",
        lonHemi: "W",
        timeUtc: "1430",
      },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("5130 N");
    expect(lines.sub).toBe("00007 W  1430Z");
  });

  it("shows call-log screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "call-log" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("CALL LOG");
    expect(lines.sub).toBe("NO ENTRIES");
  });

  it("shows sending screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "sending" },
    };
    const lines = displayLines(state);
    expect(lines.main).toBe("SENDING DSC...");
  });
});

describe("isDscMenuOpen", () => {
  it("returns false when closed", () => {
    expect(isDscMenuOpen(INITIAL_RADIO_STATE)).toBe(false);
  });

  it("returns true when menu is open", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "top-menu", cursor: 0 },
    };
    expect(isDscMenuOpen(state)).toBe(true);
  });
});

describe("isDscDigitScreen", () => {
  it("returns true for MMSI entry screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "individual-mmsi", buffer: "" },
    };
    expect(isDscDigitScreen(state)).toBe(true);
  });

  it("returns true for position-lat screen", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "position-lat", buffer: "", hemisphere: "N" },
    };
    expect(isDscDigitScreen(state)).toBe(true);
  });

  it("returns false for top-menu", () => {
    const state: RadioState = {
      ...INITIAL_RADIO_STATE,
      dscMenu: { screen: "top-menu", cursor: 0 },
    };
    expect(isDscDigitScreen(state)).toBe(false);
  });

  it("returns false when closed", () => {
    expect(isDscDigitScreen(INITIAL_RADIO_STATE)).toBe(false);
  });
});

describe("squelchToPercent", () => {
  it("converts 0 to 0", () => {
    expect(squelchToPercent(0)).toBe(0);
  });

  it("converts 9 to 100", () => {
    expect(squelchToPercent(9)).toBe(100);
  });

  it("converts 4 to ~44.4", () => {
    expect(squelchToPercent(4)).toBeCloseTo(44.44, 1);
  });
});

describe("isVoiceBlocked", () => {
  it("returns true on channel 70", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 70 };
    expect(isVoiceBlocked(state)).toBe(true);
  });

  it("returns true on guard channel 75", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 75 };
    expect(isVoiceBlocked(state)).toBe(true);
  });

  it("returns true on guard channel 76", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 76 };
    expect(isVoiceBlocked(state)).toBe(true);
  });

  it("returns false on other channels", () => {
    expect(isVoiceBlocked(INITIAL_RADIO_STATE)).toBe(false);
  });
});

describe("isDscOnly", () => {
  it("returns true for channel 70", () => {
    expect(isDscOnly(70)).toBe(true);
  });

  it("returns false for other channels", () => {
    expect(isDscOnly(16)).toBe(false);
    expect(isDscOnly(9)).toBe(false);
  });
});
