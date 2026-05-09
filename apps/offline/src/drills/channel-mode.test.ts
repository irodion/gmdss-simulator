import { describe, expect, test } from "vite-plus/test";
import {
  buildChannelChallengeWithDirection,
  generateChannelChallenges,
  scoreChannel,
} from "./channel-mode.ts";
import { CHANNELS, getChannelEntry } from "./channels.ts";
import type { DrillChallenge } from "./drill-types.ts";

describe("CHANNELS data integrity", () => {
  test("every channel id and usage label is unique", () => {
    const ids = new Set(CHANNELS.map((c) => c.channel));
    const usages = new Set(CHANNELS.map((c) => c.usage));
    expect(ids.size).toBe(CHANNELS.length);
    expect(usages.size).toBe(CHANNELS.length);
  });

  test("descriptions are non-empty (used in usage→channel prompts)", () => {
    for (const entry of CHANNELS) {
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  test("at least 4 channels exist (needed for 4-option MC distractors)", () => {
    expect(CHANNELS.length).toBeGreaterThanOrEqual(4);
  });

  test("getChannelEntry round-trips by id", () => {
    for (const entry of CHANNELS) {
      expect(getChannelEntry(entry.channel)).toBe(entry);
    }
    expect(getChannelEntry("999")).toBeUndefined();
  });
});

describe("generateChannelChallenges", () => {
  test("returns the requested number of challenges (when pool is large enough)", () => {
    const out = generateChannelChallenges(5);
    expect(out).toHaveLength(5);
  });

  test("returns distinct channel ids when count <= pool size", () => {
    const out = generateChannelChallenges(CHANNELS.length);
    const ids = new Set(out.map((c) => c.channelId));
    expect(ids.size).toBe(out.length);
  });

  test("fills with repeats when count > pool so the requested length is honored", () => {
    const target = CHANNELS.length + 11;
    const out = generateChannelChallenges(target);
    expect(out).toHaveLength(target);
    for (const c of out) {
      expect(CHANNELS.some((entry) => entry.channel === c.channelId)).toBe(true);
    }
  });

  test("count of 0 or negative returns no challenges", () => {
    expect(generateChannelChallenges(0)).toEqual([]);
    expect(generateChannelChallenges(-3)).toEqual([]);
  });

  test("every challenge carries type 'channel' and a channelDirection + channelId", () => {
    const out = generateChannelChallenges(CHANNELS.length);
    for (const c of out) {
      expect(c.type).toBe("channel");
      expect(c.channelDirection).toBeDefined();
      expect(c.channelId).toBeDefined();
      expect(c.choices).toBeDefined();
      expect(c.choices!.length).toBe(4);
      expect(new Set(c.choices).size).toBe(4);
      expect(c.choices).toContain(c.expectedAnswer);
    }
  });

  test("every count >= 2 session contains both directions (the help text promises a mix)", () => {
    for (let trial = 0; trial < 30; trial++) {
      for (const count of [2, 5, 10, 20]) {
        const directions = new Set(generateChannelChallenges(count).map((c) => c.channelDirection));
        expect(directions.has("channel-to-usage")).toBe(true);
        expect(directions.has("usage-to-channel")).toBe(true);
      }
    }
  });
});

describe("buildChannelChallengeWithDirection", () => {
  const entry = CHANNELS.find((c) => c.channel === "16")!;

  test("channel-to-usage: prompt mentions the channel and expects the usage label", () => {
    const ch = buildChannelChallengeWithDirection(entry, "channel-to-usage", 0);
    expect(ch.prompt).toMatch(/Channel 16/);
    expect(ch.expectedAnswer).toBe(entry.usage);
    expect(ch.choices).toContain(entry.usage);
  });

  test("usage-to-channel: prompt mentions the description and expects 'Channel <id>'", () => {
    const ch = buildChannelChallengeWithDirection(entry, "usage-to-channel", 0);
    expect(ch.prompt).toContain(entry.description);
    expect(ch.expectedAnswer).toBe("Channel 16");
    expect(ch.choices).toContain("Channel 16");
    for (const choice of ch.choices!) {
      expect(choice).toMatch(/^Channel /);
    }
  });

  test("ids encode index, channel, and direction (so two directions of the same channel get distinct ids)", () => {
    const a = buildChannelChallengeWithDirection(entry, "channel-to-usage", 7);
    const b = buildChannelChallengeWithDirection(entry, "usage-to-channel", 7);
    expect(a.id).not.toBe(b.id);
  });
});

describe("scoreChannel", () => {
  function ch(over: Partial<DrillChallenge>): DrillChallenge {
    return {
      id: "t",
      type: "channel",
      channelDirection: "channel-to-usage",
      channelId: "16",
      prompt: "What is the primary use of Channel 16?",
      expectedAnswer: "Distress, safety, and calling",
      choices: ["Distress, safety, and calling", "A", "B", "C"],
      ...over,
    };
  }

  test("scores exact match as 100", () => {
    expect(scoreChannel(ch({}), "Distress, safety, and calling").score).toBe(100);
  });

  test("scoring is case-insensitive and trims whitespace", () => {
    expect(scoreChannel(ch({}), "  distress, safety, and calling  ").score).toBe(100);
  });

  test("rejects a wrong choice with score 0 and reports it as missed", () => {
    const c = ch({});
    const r = scoreChannel(c, "A");
    expect(r.score).toBe(0);
    expect(r.matchedWords).toEqual([]);
    expect(r.missedWords).toEqual(["Distress, safety, and calling"]);
  });
});

describe("scoreChannel interplay with generated challenges", () => {
  test("a generated challenge scores its expectedAnswer as correct", () => {
    const out = generateChannelChallenges(CHANNELS.length);
    for (const c of out) {
      expect(scoreChannel(c, c.expectedAnswer).score).toBe(100);
    }
  });
});
