import { describe, expect, it, vi, afterEach } from "vite-plus/test";
import { scoreTranscript, resolveRubricTemplates } from "../src/rubric-engine.ts";
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
      patterns: ["RCC\\s*HAIFA"],
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
          "RCC HAIFA RCC HAIFA RCC HAIFA, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, RADIO CHECK ON CHANNEL ONE SIX, OVER",
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
      const turns: Turn[] = [makeTurn("RCC HAIFA, THIS IS, RADIO CHECK, OVER")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      expect(score.overall).toBeLessThan(100);

      const fields = score.dimensions.find((d) => d.id === "required_fields")!;
      expect(fields.missingItems).toContain("Own vessel name");
      expect(fields.score).toBe(75); // 3 of 4 fields
    });

    it("penalizes missing OVER proword", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [makeTurn("RCC HAIFA, THIS IS BLUE DUCK, RADIO CHECK")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const prowords = score.dimensions.find((d) => d.id === "prowords")!;
      expect(prowords.missingItems).toContain("OVER");
      expect(prowords.score).toBe(50); // 1 of 2
    });

    it("penalizes wrong channel", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn(
          "RCC HAIFA, THIS IS BLUE DUCK, RADIO CHECK, OVER",
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
      const turns: Turn[] = [makeTurn("RCC HAIFA, THIS IS BLUE DUCK, RADIO CHECK, OVER", 70)];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const channel = score.dimensions.find((d) => d.id === "channel")!;
      expect(channel.score).toBe(0);
      expect(channel.missingItems[0]).toContain("Ch.70");
    });

    it("gives partial credit for out-of-order fields", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      // vessel name before THIS IS (wrong order)
      const turns: Turn[] = [makeTurn("BLUE DUCK, RCC HAIFA, RADIO CHECK THIS IS, OVER")];
      const score = scoreTranscript(turns, ROUTINE_RUBRIC, 16);

      const seq = score.dimensions.find((d) => d.id === "sequence")!;
      expect(seq.score).toBeLessThan(100);
      expect(seq.score).toBeGreaterThan(0);
    });

    it("handles multiple student turns", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const turns: Turn[] = [
        makeTurn("RCC HAIFA, THIS IS BLUE DUCK", 16, 0),
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
      const turns: Turn[] = [makeTurn("RCC HAIFA, THIS IS BLUE DUCK, RADIO CHECK, OVER")];

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
          "RCC HAIFA RCC HAIFA RCC HAIFA, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, RADIO CHECK ON CHANNEL ONE SIX, OVER",
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
      const turns: Turn[] = [makeTurn("RCC HAIFA, THIS IS BLUE DUCK, RADIO CHECK", 12)];
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

describe("scoreTranscript — channel 06 scenario", () => {
  const CH06_RUBRIC: RubricDefinition = {
    ...ROUTINE_RUBRIC,
    id: "v1/routine-ch06",
    channelRules: { requiredChannel: 6, blockChannel70Voice: true },
  };

  it("stays on channel 06 scores 100", () => {
    const turns = [makeTurn("BLUE DUCK THIS IS BLUE DUCK RADIO CHECK OVER", 6, 0)];
    const score = scoreTranscript(turns, CH06_RUBRIC, 6);
    const channel = score.dimensions.find((d) => d.id === "channel")!;
    expect(channel.score).toBe(100);
    expect(channel.missingItems).toHaveLength(0);
  });

  it("switching to ch.16 mid-session reduces channel score", () => {
    const turns = [
      makeTurn("BLUE DUCK THIS IS BLUE DUCK RADIO CHECK OVER", 6, 0),
      makeTurn("ROGER OUT", 16, 1),
    ];
    const score = scoreTranscript(turns, CH06_RUBRIC, 6);
    const channel = score.dimensions.find((d) => d.id === "channel")!;
    expect(channel.score).toBeLessThan(100);
    expect(channel.missingItems.some((m) => m.includes("Ch.16"))).toBe(true);
  });

  it("all turns on wrong channel scores 0", () => {
    const turns = [makeTurn("RADIO CHECK", 16, 0)];
    const score = scoreTranscript(turns, CH06_RUBRIC, 6);
    const channel = score.dimensions.find((d) => d.id === "channel")!;
    expect(channel.score).toBe(0);
  });
});

describe("scoreTranscript — closing reply rubric", () => {
  const CLOSING_RUBRIC: RubricDefinition = {
    id: "v1/routine-closing",
    version: "1.0.0",
    category: "routine",
    requiredFields: [
      {
        id: "station_name",
        label: "Station name (called)",
        patterns: ["RCC\\s*HAIFA"],
        required: true,
      },
      { id: "this_is", label: "THIS IS", patterns: ["THIS\\s+IS"], required: true },
      {
        id: "callsign",
        label: "Vessel callsign",
        patterns: ["5\\s*B\\s*C\\s*D\\s*2"],
        required: true,
      },
      { id: "roger", label: "ROGER", patterns: ["\\bROGER\\b"], required: true },
      {
        id: "nothing_else",
        label: "NOTHING ELSE FOR YOU",
        patterns: ["NOTHING\\s+ELSE\\s+FOR\\s+YOU"],
        required: true,
      },
    ],
    prowordRules: [
      { id: "this_is", label: "THIS IS", pattern: "THIS\\s+IS" },
      { id: "out", label: "OUT", pattern: "\\bOUT\\b" },
    ],
    sequenceRules: {
      fieldOrder: ["station_name", "this_is", "callsign", "roger", "nothing_else", "out"],
    },
    channelRules: { requiredChannel: 6, blockChannel70Voice: true },
  };

  it("scores a perfect closing reply at 100%", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS 5BCD2 5BCD2 ROGER NOTHING ELSE FOR YOU OUT", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    expect(score.overall).toBe(100);
  });

  it("penalizes missing ROGER", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS 5BCD2 NOTHING ELSE FOR YOU OUT", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    expect(score.overall).toBeLessThan(100);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).toContain("ROGER");
  });

  it("penalizes missing callsign", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS ROGER NOTHING ELSE FOR YOU OUT", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).toContain("Vessel callsign");
  });

  it("penalizes missing NOTHING ELSE FOR YOU", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS 5BCD2 ROGER OUT", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).toContain("NOTHING ELSE FOR YOU");
  });

  it("penalizes missing OUT proword", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS 5BCD2 ROGER NOTHING ELSE FOR YOU", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    const prowords = score.dimensions.find((d) => d.id === "prowords")!;
    expect(prowords.missingItems).toContain("OUT");
  });

  it("tolerates spacing in callsign from STT", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn("RCC HAIFA THIS IS 5 B C D 2 ROGER NOTHING ELSE FOR YOU OUT", 6)];
    const score = scoreTranscript(turns, CLOSING_RUBRIC, 6);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).not.toContain("Vessel callsign");
  });
});

describe("resolveRubricTemplates", () => {
  const TEMPLATE_RUBRIC: RubricDefinition = {
    id: "v1/routine-closing",
    version: "1.0.0",
    category: "routine",
    requiredFields: [
      { id: "callsign", label: "Vessel callsign", patterns: ["{{callsign}}"], required: true },
      { id: "station", label: "Station", patterns: ["RCC\\s*HAIFA"], required: true },
    ],
    prowordRules: [{ id: "out", label: "OUT", pattern: "\\bOUT\\b" }],
    sequenceRules: { fieldOrder: ["callsign", "station"] },
    channelRules: { requiredChannel: 6, blockChannel70Voice: true },
  };

  it("substitutes {{callsign}} with spaced regex", () => {
    const resolved = resolveRubricTemplates(TEMPLATE_RUBRIC, { callsign: "5BCD2" });
    const callsignField = resolved.requiredFields.find((f) => f.id === "callsign")!;
    expect(callsignField.patterns[0]).toBe("5\\s*B\\s*C\\s*D\\s*2");
  });

  it("substitutes {{mmsi}} with spaced regex so STT digit grouping matches", () => {
    const rubric: RubricDefinition = {
      ...TEMPLATE_RUBRIC,
      requiredFields: [
        { id: "mmsi", label: "Vessel MMSI", patterns: ["{{mmsi}}"], required: true },
      ],
      sequenceRules: { fieldOrder: ["mmsi"] },
    };
    const resolved = resolveRubricTemplates(rubric, { mmsi: "211239680" });
    const mmsiField = resolved.requiredFields.find((f) => f.id === "mmsi")!;
    expect(mmsiField.patterns[0]).toBe("2\\s*1\\s*1\\s*2\\s*3\\s*9\\s*6\\s*8\\s*0");
    expect(new RegExp(mmsiField.patterns[0]!).test("211 239 680")).toBe(true);
  });

  it("leaves patterns without templates unchanged", () => {
    const resolved = resolveRubricTemplates(TEMPLATE_RUBRIC, { callsign: "5BCD2" });
    const stationField = resolved.requiredFields.find((f) => f.id === "station")!;
    expect(stationField.patterns[0]).toBe("RCC\\s*HAIFA");
  });

  it("fails closed when callsign is empty", () => {
    const resolved = resolveRubricTemplates(TEMPLATE_RUBRIC, { callsign: "" });
    const callsignField = resolved.requiredFields.find((f) => f.id === "callsign")!;
    expect(callsignField.patterns[0]).toBe("(?!)");
    expect(new RegExp(callsignField.patterns[0]!).test("anything")).toBe(false);
  });
});

describe("scoreTranscript — DSC dimension", () => {
  const DISTRESS_RUBRIC: RubricDefinition = {
    id: "v1/distress",
    version: "1.1.0",
    category: "distress",
    requiredFields: [
      { id: "mayday", label: "MAYDAY", patterns: ["MAYDAY"], required: true },
      { id: "this_is", label: "THIS IS", patterns: ["THIS\\s+IS"], required: true },
      { id: "vessel_name", label: "Vessel name", patterns: ["BLUE\\s*DUCK"], required: true },
      {
        id: "position",
        label: "Position",
        patterns: [
          "\\d+.{0,80}?(?:NORTH|SOUTH|EAST|WEST|\\b[NSEW]\\b)",
          "\\b(?:ZERO|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE)\\b.{0,80}?(?:NORTH|SOUTH|EAST|WEST|\\b[NSEW]\\b)",
        ],
        required: true,
      },
      { id: "nature", label: "Nature", patterns: ["FIRE|FLOODING|SINKING"], required: true },
      {
        id: "assistance",
        label: "Assistance",
        patterns: ["REQUIRE|REQUEST|ASSISTANCE"],
        required: true,
      },
      { id: "persons", label: "Persons", patterns: ["PERSON|POB"], required: true },
    ],
    prowordRules: [
      { id: "mayday", label: "MAYDAY (×4)", pattern: "MAYDAY", expectedCount: 4 },
      { id: "this_is", label: "THIS IS", pattern: "THIS\\s+IS" },
      { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
    ],
    sequenceRules: {
      fieldOrder: [
        "mayday",
        "this_is",
        "vessel_name",
        "position",
        "nature",
        "assistance",
        "persons",
        "over",
      ],
    },
    channelRules: { requiredChannel: 16, blockChannel70Voice: true },
    dscRules: { required: true, beforeFirstVoiceTurn: true },
  };

  const PERFECT_MAYDAY =
    "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK MAYDAY THIS IS BLUE DUCK POSITION FIVE ZERO DEGREES ZERO SIX MINUTES NORTH ZERO ZERO ONE DEGREES ONE TWO MINUTES WEST FIRE REQUEST IMMEDIATE ASSISTANCE EIGHT PERSONS ON BOARD OVER";

  it("falls back to legacy 4-dimension weights without dscContext", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16);
    expect(score.dimensions).toHaveLength(4);
    expect(score.dimensions.find((d) => d.id === "dsc")).toBeUndefined();
  });

  it("adds DSC dimension when context is provided", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16, undefined, {
      distressAlertSentAt: 500,
      distressAlertNature: "fire",
      firstStudentTurnAt: 1000,
      expectedNature: "fire",
    });
    expect(score.dimensions).toHaveLength(5);
    const dsc = score.dimensions.find((d) => d.id === "dsc")!;
    expect(dsc.score).toBe(100);
    expect(dsc.matchedItems).toContain("DSC distress alert sent");
    expect(dsc.matchedItems).toContain("Sent before voice");
    expect(score.overall).toBe(100);
  });

  it("scores 0 when no DSC alert was sent", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16, undefined, {
      distressAlertSentAt: null,
      distressAlertNature: null,
      firstStudentTurnAt: 1000,
      expectedNature: "fire",
    });
    const dsc = score.dimensions.find((d) => d.id === "dsc")!;
    expect(dsc.score).toBe(0);
    expect(dsc.missingItems).toContain("DSC distress alert sent");
    // overall ≤ 80 because dsc dimension is 20% weight
    expect(score.overall).toBeLessThanOrEqual(80);
  });

  it("penalizes DSC alert sent after the first voice turn", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16, undefined, {
      distressAlertSentAt: 2000,
      distressAlertNature: "fire",
      firstStudentTurnAt: 1000,
      expectedNature: "fire",
    });
    const dsc = score.dimensions.find((d) => d.id === "dsc")!;
    // 50 (sent) + 0 (out of order) + 25 (nature) = 75
    expect(dsc.score).toBe(75);
    expect(dsc.missingItems).toContain("Sent before voice");
  });

  it("penalizes wrong nature", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16, undefined, {
      distressAlertSentAt: 500,
      distressAlertNature: "flooding",
      firstStudentTurnAt: 1000,
      expectedNature: "fire",
    });
    const dsc = score.dimensions.find((d) => d.id === "dsc")!;
    // 50 (sent) + 25 (before voice) + 0 (wrong nature) = 75
    expect(dsc.score).toBe(75);
    expect(dsc.missingItems.some((m) => m.includes("expected"))).toBe(true);
  });

  it("scores 100 when no expected nature is set in context", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16, undefined, {
      distressAlertSentAt: 500,
      distressAlertNature: null,
      firstStudentTurnAt: 1000,
    });
    const dsc = score.dimensions.find((d) => d.id === "dsc")!;
    expect(dsc.score).toBe(100);
  });

  it("counts MAYDAY ×4 (call ×3 + message header ×1)", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [makeTurn(PERFECT_MAYDAY, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16);
    const prowords = score.dimensions.find((d) => d.id === "prowords")!;
    expect(prowords.score).toBe(100);
  });

  it("gives partial credit when only the call MAYDAY ×3 is said", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const callOnly =
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK POSITION FIVE ZERO DEGREES NORTH ZERO ZERO ONE DEGREES WEST FIRE REQUEST ASSISTANCE EIGHT PERSONS ON BOARD OVER";
    const turns = [makeTurn(callOnly, 16)];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16);
    const prowords = score.dimensions.find((d) => d.id === "prowords")!;
    // (3/4 + 1 + 1) / 3 = ~91.67 → 92
    expect(prowords.score).toBeLessThan(100);
    expect(prowords.score).toBeGreaterThan(75);
  });

  it("rejects bare 'POSITION' keyword without coordinates", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [
      makeTurn("MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK POSITION FIRE REQUEST EIGHT PERSONS", 16),
    ];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).toContain("Position");
  });

  it("accepts numeric coordinates with cardinal direction", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    const turns = [
      makeTurn(
        "MAYDAY POSITION 50 DEGREES 06 MINUTES NORTH 001 DEGREES 12 MINUTES WEST FIRE REQUEST EIGHT PERSONS",
        16,
      ),
    ];
    const score = scoreTranscript(turns, DISTRESS_RUBRIC, 16);
    const fields = score.dimensions.find((d) => d.id === "required_fields")!;
    expect(fields.missingItems).not.toContain("Position");
  });
});
