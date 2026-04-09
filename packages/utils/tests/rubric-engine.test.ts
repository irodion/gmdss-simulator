import { describe, expect, it, vi, afterEach } from "vite-plus/test";
import { scoreTranscript } from "../src/rubric-engine.ts";
import type { RubricDefinition } from "../src/rubric-types.ts";
import type { Turn } from "../src/scenario-types.ts";

const ROUTINE_RUBRIC: RubricDefinition = {
  id: "v1/routine",
  version: "1.0.0",
  category: "routine",
  requiredFields: [
    {
      id: "station_name",
      label: "Station name (called)",
      patterns: ["ANYTOWN\\s*RADIO"],
      required: true,
    },
    {
      id: "vessel_name",
      label: "Own vessel name",
      patterns: ["BLUE\\s*DUCK"],
      required: true,
    },
    {
      id: "this_is",
      label: "THIS IS",
      patterns: ["THIS\\s+IS"],
      required: true,
    },
    {
      id: "request",
      label: "Radio check request",
      patterns: ["RADIO\\s*CHECK"],
      required: true,
    },
  ],
  prowordRules: [
    { id: "this_is", label: "THIS IS", pattern: "THIS\\s+IS" },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["station_name", "this_is", "vessel_name", "request"],
  },
  channelRules: {
    requiredChannel: 16,
    blockChannel70Voice: true,
  },
};

const SAFETY_RUBRIC: RubricDefinition = {
  id: "v1/safety",
  version: "1.0.0",
  category: "safety",
  requiredFields: [
    {
      id: "securite",
      label: "SECURITE signal word",
      patterns: ["SECURITE"],
      required: true,
    },
    {
      id: "this_is",
      label: "THIS IS",
      patterns: ["THIS\\s+IS"],
      required: true,
    },
    {
      id: "vessel_name",
      label: "Own vessel name",
      patterns: ["BLUE\\s*DUCK"],
      required: true,
    },
    {
      id: "nature",
      label: "Nature of safety message",
      patterns: ["NAVIGATIONAL\\s*WARNING|HAZARD|OBSTRUCTION"],
      required: true,
    },
  ],
  prowordRules: [
    { id: "securite", label: "SECURITE (×3)", pattern: "SECURITE", expectedCount: 3 },
    { id: "this_is", label: "THIS IS", pattern: "THIS\\s+IS" },
    { id: "out", label: "OUT", pattern: "\\bOUT\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["securite", "this_is", "vessel_name", "nature"],
  },
  channelRules: {
    requiredChannel: 16,
    blockChannel70Voice: true,
  },
};

function makeTurn(text: string, channel = 16, index = 0): Turn {
  return {
    index,
    speaker: "student",
    text,
    timestamp: 1000 + index * 1000,
    channel,
    durationMs: 3000,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("scoreTranscript", () => {
  describe("routine rubric", () => {
    it("scores a perfect radio check at 100%", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn(
          "ANYTOWN RADIO ANYTOWN RADIO ANYTOWN RADIO, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, RADIO CHECK ON CHANNEL ONE SIX, OVER",
        ),
      ];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      expect(score.overall).toBe(100);
      expect(score.rubricVersion).toBe("1.0.0");
      expect(score.dimensions).toHaveLength(4);

      // All dimensions should be 100
      for (const dim of score.dimensions) {
        expect(dim.score).toBe(100);
        expect(dim.missingItems).toHaveLength(0);
      }
    });

    it("penalizes missing vessel name", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("ANYTOWN RADIO, THIS IS, RADIO CHECK, OVER")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      expect(score.overall).toBeLessThan(100);

      const fields = score.dimensions.find((d) => d.id === "required_fields")!;
      expect(fields.missingItems).toContain("Own vessel name");
      expect(fields.score).toBe(75); // 3 of 4 fields
    });

    it("penalizes missing OVER proword", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const prowords = score.dimensions.find((d) => d.id === "prowords")!;
      expect(prowords.missingItems).toContain("OVER");
      expect(prowords.score).toBe(50); // 1 of 2
    });

    it("penalizes wrong channel", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn(
          "ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK, OVER",
          12, // wrong channel
        ),
      ];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const channel = score.dimensions.find((d) => d.id === "channel")!;
      expect(channel.score).toBe(0);
      expect(channel.missingItems.length).toBeGreaterThan(0);
    });

    it("scores channel 70 voice as a violation", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK, OVER", 70)];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const channel = score.dimensions.find((d) => d.id === "channel")!;
      expect(channel.score).toBe(0);
      expect(channel.missingItems[0]).toContain("Ch.70");
    });

    it("gives partial credit for out-of-order fields", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      // vessel name before THIS IS (wrong order)
      const turns: Turn[] = [makeTurn("BLUE DUCK, ANYTOWN RADIO, RADIO CHECK THIS IS, OVER")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const seq = score.dimensions.find((d) => d.id === "sequence")!;
      expect(seq.score).toBeLessThan(100);
      expect(seq.score).toBeGreaterThan(0);
    });

    it("handles multiple student turns", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn("ANYTOWN RADIO, THIS IS BLUE DUCK", 16, 0),
        makeTurn("RADIO CHECK, OVER", 16, 1),
      ];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const fields = score.dimensions.find((d) => d.id === "required_fields")!;
      expect(fields.score).toBe(100); // all fields present across turns
    });

    it("handles empty transcript", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const score = scoreTranscript([], ROUTINE_RUBRIC, 16);

      expect(score.overall).toBe(0);
      const channel = score.dimensions.find((d) => d.id === "channel")!;
      expect(channel.score).toBe(0);
    });
  });

  describe("safety rubric", () => {
    it("gives partial credit for fewer than 3 SECURITE repetitions", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn("SECURITE SECURITE, THIS IS BLUE DUCK, NAVIGATIONAL WARNING, OUT"),
      ];
      const score = scoreTranscript(turns, SAFETY_RUBRIC, 16);

      const prowords = score.dimensions.find((d) => d.id === "prowords")!;
      // SECURITE: 2/3 = 0.67, THIS IS: 1, OUT: 1 → (0.67 + 1 + 1) / 3 ≈ 89
      expect(prowords.score).toBeLessThan(100);
      expect(prowords.score).toBeGreaterThan(50);

      const matched = prowords.matchedItems.find((m) => m.includes("SECURITE"));
      expect(matched).toContain("2/3");
    });

    it("scores full SECURITE repetitions", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn("SECURITE SECURITE SECURITE, THIS IS BLUE DUCK, NAVIGATIONAL WARNING, OUT"),
      ];
      const score = scoreTranscript(turns, SAFETY_RUBRIC, 16);

      const prowords = score.dimensions.find((d) => d.id === "prowords")!;
      expect(prowords.score).toBe(100);
    });
  });

  describe("determinism", () => {
    it("produces identical scores for identical inputs", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK, OVER")];

      const score1 = scoreTranscript(turns, ROUTINE_RUBRIC, 16);
      const score2 = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      expect(score1.overall).toBe(score2.overall);
      expect(score1.dimensions).toEqual(score2.dimensions);
    });
  });

  describe("full scoring", () => {
    it("perfect routine radio check", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn(
          "ANYTOWN RADIO ANYTOWN RADIO ANYTOWN RADIO, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, RADIO CHECK ON CHANNEL ONE SIX, OVER",
        ),
      ];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);
      expect(score.overall).toBe(100);
      expect(score.timestamp).toBe(10000);
      expect(score.dimensions.every((d) => d.score === 100)).toBe(true);
    });

    it("missing all fields", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("HELLO WORLD")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);
      expect(score.overall).toBe(15);
      expect(score.dimensions[0]?.score).toBe(0); // required_fields
      expect(score.dimensions[3]?.score).toBe(100); // channel correct
    });

    it("wrong channel and missing prowords", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK", 12)];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);
      expect(score.overall).toBe(73);
      expect(score.dimensions[1]?.score).toBe(50); // prowords partial
      expect(score.dimensions[3]?.score).toBe(0); // wrong channel
    });

    it("safety with partial SECURITE count", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn("SECURITE SECURITE, THIS IS BLUE DUCK, NAVIGATIONAL WARNING, OUT"),
      ];
      const score = scoreTranscript(turns, SAFETY_RUBRIC, 16);
      expect(score.overall).toBe(97);
      expect(score.dimensions[1]?.score).toBe(89); // prowords (2/3 SECURITE)
    });
  });
});
