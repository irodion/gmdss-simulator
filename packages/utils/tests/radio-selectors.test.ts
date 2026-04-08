import { describe, expect, it } from "vite-plus/test";
import { displayLines, isVoiceBlocked, isDscOnly } from "../src/radio-selectors.ts";
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
    expect(lines.footer).toBe("PWR 25W  SQL 04  GPS LOCK");
  });

  it("shows dual watch when enabled", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, dualWatch: true };
    expect(displayLines(state).sub).toBe("DUAL WATCH: CH 16");
  });

  it("shows low power", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, power: "low" };
    expect(displayLines(state).footer).toContain("PWR 1W");
  });

  it("shows squelch with zero padding", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, squelch: 7 };
    expect(displayLines(state).footer).toContain("SQL 07");
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
