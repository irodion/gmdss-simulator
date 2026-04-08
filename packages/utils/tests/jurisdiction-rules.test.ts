import { describe, expect, it } from "vite-plus/test";
import {
  getCallingChannel,
  isChannelValidForVoice,
  getWorkingChannel,
} from "../src/jurisdiction-rules.ts";
import type { JurisdictionProfile } from "../src/jurisdiction-types.ts";

const MOCK_PROFILE: JurisdictionProfile = {
  id: "international",
  label: "International (ITU)",
  calling_channel: 16,
  dsc_channel: 70,
  notes: null,
  channel_plan: {
    "6": { purpose: "Intership Safety", type: "voice", tx_allowed: true },
    "12": { purpose: "Port Operations", type: "voice", tx_allowed: true },
    "13": { purpose: "Bridge-to-bridge", type: "voice", tx_allowed: true, max_power: "low" },
    "16": { purpose: "Distress, Safety and Calling", type: "voice", tx_allowed: true },
    "70": { purpose: "DSC", type: "dsc_only", tx_allowed: false },
    "72": { purpose: "Intership working", type: "voice", tx_allowed: true },
  },
};

describe("getCallingChannel", () => {
  it("returns calling channel for distress", () => {
    expect(getCallingChannel(MOCK_PROFILE, "distress")).toBe(16);
  });

  it("returns calling channel for urgency", () => {
    expect(getCallingChannel(MOCK_PROFILE, "urgency")).toBe(16);
  });

  it("returns calling channel for safety", () => {
    expect(getCallingChannel(MOCK_PROFILE, "safety")).toBe(16);
  });

  it("returns calling channel for routine", () => {
    expect(getCallingChannel(MOCK_PROFILE, "routine")).toBe(16);
  });
});

describe("isChannelValidForVoice", () => {
  it("returns false for channel 70 (DSC only)", () => {
    expect(isChannelValidForVoice(MOCK_PROFILE, 70)).toBe(false);
  });

  it("returns false for guard band channels 75 and 76", () => {
    expect(isChannelValidForVoice(MOCK_PROFILE, 75)).toBe(false);
    expect(isChannelValidForVoice(MOCK_PROFILE, 76)).toBe(false);
  });

  it("returns true for standard voice channels", () => {
    expect(isChannelValidForVoice(MOCK_PROFILE, 16)).toBe(true);
    expect(isChannelValidForVoice(MOCK_PROFILE, 6)).toBe(true);
    expect(isChannelValidForVoice(MOCK_PROFILE, 12)).toBe(true);
  });

  it("returns false for dsc_only channels in the plan", () => {
    const profile: JurisdictionProfile = {
      ...MOCK_PROFILE,
      channel_plan: {
        "80": { purpose: "Special DSC", type: "dsc_only", tx_allowed: false },
      },
    };
    expect(isChannelValidForVoice(profile, 80)).toBe(false);
  });
});

describe("getWorkingChannel", () => {
  it("finds a channel by purpose", () => {
    expect(getWorkingChannel(MOCK_PROFILE, "Port Operations")).toBe(12);
  });

  it("matches case-insensitively", () => {
    expect(getWorkingChannel(MOCK_PROFILE, "port operations")).toBe(12);
  });

  it("matches partial purpose strings", () => {
    expect(getWorkingChannel(MOCK_PROFILE, "bridge")).toBe(13);
  });

  it("returns null when no match", () => {
    expect(getWorkingChannel(MOCK_PROFILE, "fishing")).toBeNull();
  });
});
