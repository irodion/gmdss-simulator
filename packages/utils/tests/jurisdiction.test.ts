import { describe, expect, test } from "vite-plus/test";

import { validateJurisdiction, type JurisdictionProfile } from "../src/index.ts";

const international: JurisdictionProfile = {
  id: "international",
  label: "International (ITU default)",
  channel_plan: {
    "06": { purpose: "Ship-to-ship safety", type: "voice", tx_allowed: true },
    "08": { purpose: "Ship-to-ship", type: "voice", tx_allowed: true },
    "09": { purpose: "Calling, boating activities", type: "voice", tx_allowed: true },
    "10": { purpose: "Ship-to-ship", type: "voice", tx_allowed: true },
    "13": {
      purpose: "Bridge-to-bridge navigation safety",
      type: "voice",
      tx_allowed: true,
      max_power: "low",
    },
    "16": { purpose: "Distress, safety, and calling", type: "voice", tx_allowed: true },
    "67": { purpose: "Small craft safety", type: "voice", tx_allowed: true },
    "70": { purpose: "Digital Selective Calling", type: "dsc_only", tx_allowed: false },
    "72": { purpose: "Ship-to-ship", type: "voice", tx_allowed: true },
    "77": { purpose: "Ship-to-ship", type: "voice", tx_allowed: true },
  },
  calling_channel: 16,
  dsc_channel: 70,
  notes: "Standard ITU Radio Regulations Appendix 18 channel plan.",
};

describe("international jurisdiction profile", () => {
  test("validates without errors", () => {
    expect(validateJurisdiction(international)).toHaveLength(0);
  });

  test("has Channel 16 as calling channel", () => {
    expect(international.calling_channel).toBe(16);
  });

  test("has Channel 70 as DSC channel", () => {
    expect(international.dsc_channel).toBe(70);
  });

  test("Channel 70 has tx_allowed: false", () => {
    expect(international.channel_plan["70"]!.tx_allowed).toBe(false);
  });

  test("Channel 70 has type dsc_only", () => {
    expect(international.channel_plan["70"]!.type).toBe("dsc_only");
  });

  test("Channel 13 has max_power: low", () => {
    expect(international.channel_plan["13"]!.max_power).toBe("low");
  });

  test("all channels have valid type", () => {
    for (const def of Object.values(international.channel_plan)) {
      expect(["voice", "dsc_only"]).toContain(def.type);
    }
  });
});

describe("validateJurisdiction", () => {
  test("rejects profile without calling_channel in channel_plan", () => {
    const bad: JurisdictionProfile = {
      ...international,
      calling_channel: 99,
    };
    const errors = validateJurisdiction(bad);
    expect(errors.some((e) => e.includes("calling_channel"))).toBe(true);
  });

  test("rejects profile with empty channel_plan", () => {
    const bad: JurisdictionProfile = {
      ...international,
      channel_plan: {},
    };
    const errors = validateJurisdiction(bad);
    expect(errors.some((e) => e.includes("channel_plan"))).toBe(true);
  });

  test("rejects profile with missing id", () => {
    const bad: JurisdictionProfile = {
      ...international,
      id: "",
    };
    const errors = validateJurisdiction(bad);
    expect(errors.some((e) => e.includes("id"))).toBe(true);
  });
});
