import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { materializeScenario } from "./materialize.ts";
import { isPriorityItem, type RubricsById, type Scenario } from "./types.ts";

// A voice-only distress rubric: a single spoken-message part. The DSC/equipment
// phase is owned by the panel, so the rubric carries no procedure chips, nature
// pools, or channel/callsign decoys (those were retired in #99).
const DISTRESS: RubricDefinition = {
  id: "v1/distress",
  version: "1.2.0",
  category: "distress",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "this_is", label: "THIS IS" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "position", label: "Position" },
        { id: "nature", label: "Nature of distress" },
        { id: "assistance", label: "Request immediate assistance" },
        { id: "persons", label: "Persons on board" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
};

// A two-phase voice rubric (DSC routine call + voice report). The first phase
// now carries no spoken chips, so the materializer drops the empty part.
const MULTIPART: RubricDefinition = {
  id: "v1/routine-tr",
  version: "1.0.0",
  category: "routine",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 26, blockChannel70Voice: true },
  sequenceParts: [
    { id: "empty_dsc_phase", label: "DSC routine call", items: [] },
    {
      id: "voice_report",
      label: "Voice Transit Report (working channel)",
      items: [
        { id: "addressee", label: "Coast station name" },
        { id: "this_is", label: "THIS IS" },
        { id: "vessel", label: "Vessel name" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
};

const RUBRICS: RubricsById = { "v1/distress": DISTRESS, "v1/routine-tr": MULTIPART };

const DISTRESS_SCENARIO: Scenario = {
  id: "fire-blue-duck",
  priority: "mayday",
  rubricId: "v1/distress",
  brief: "Engine room fire on MV Blue Duck.",
  facts: {
    vessel: "Blue Duck",
    callsign: "5BCD2",
    position: "32°05'N 034°45'E",
    nature: "Engine room fire",
    assistance: "I require immediate assistance",
    persons: "6 persons on board",
  },
  dsc: {
    state: "required",
    callType: "distress",
    nature: "fire",
    channel: 16,
    power: "high",
    epirb: true,
  },
};

describe("materializeScenario", () => {
  test("carries the rubric id, priority, and first part label as the call heading", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    expect(template.rubricId).toBe("v1/distress");
    expect(template.priorityId).toBe("mayday");
    expect(template.callLabel).toBe("MAYDAY procedure");
  });

  test("injects scenario facts into the voice chips, falling back to the chip label", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const items = template.parts[0]!.items;
    expect(items.filter((i) => i.id === "vessel").every((i) => i.label === "Blue Duck")).toBe(true);
    expect(items.find((i) => i.id === "nature")!.label).toBe("Engine room fire");
    // No matching fact for the signal word → the chip's own label is kept.
    expect(items.find((i) => i.id === "this_is")!.label).toBe("THIS IS");
    expect(items.at(-1)!.id).toBe("over");
  });

  test("the pool is the correct voice chips plus three openings for each wrong priority", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    // 11 voice chips + 3 PAN-PAN + 3 SECURITE wrong-priority decoys.
    expect(template.pool).toHaveLength(17);
    expect(template.pool.filter((i) => i.id === "pan_pan")).toHaveLength(3);
    expect(template.pool.filter((i) => i.id === "securite")).toHaveLength(3);
    // The correct opening word is NOT added as a decoy.
    expect(template.pool.filter((i) => i.id === "mayday")).toHaveLength(3); // only the correct chips
    expect(template.pool.every((i) => i.id !== "routine")).toBe(true);
  });

  test("only priority openings and the scenario's own voice chips appear — no decoy pools", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const knownIds = new Set([
      "mayday",
      "this_is",
      "vessel",
      "callsign",
      "position",
      "nature",
      "assistance",
      "persons",
      "over",
      "pan_pan",
      "securite",
    ]);
    expect(template.pool.every((i) => knownIds.has(i.id))).toBe(true);
    expect(template.pool.some((i) => i.id.startsWith("decoy_"))).toBe(false);
  });

  test("drops empty sequence parts and uses the surviving part's label as the heading", () => {
    const tr: Scenario = {
      id: "tr-sea-sprite",
      priority: "routine",
      rubricId: "v1/routine-tr",
      brief: "Transit report to Haifa Radio.",
      facts: { vessel: "Sea Sprite", addressee: "Haifa Radio" },
      dsc: {
        state: "required",
        callType: "individual",
        priority: "routine",
        addressee: "haifa_radio",
        channel: 26,
        power: "high",
        epirb: false,
      },
    };
    const template = materializeScenario(tr, RUBRICS);
    // The empty DSC phase is gone; only the voice report remains.
    expect(template.parts).toHaveLength(1);
    expect(template.parts[0]!.id).toBe("voice_report");
    expect(template.callLabel).toBe("Voice Transit Report (working channel)");
    expect(template.parts[0]!.items.find((i) => i.id === "addressee")!.label).toBe("Haifa Radio");
    // Routine carries no signal word, so all three signal words are decoys.
    const priorityDecoys = template.pool.filter((i) => isPriorityItem(i.id));
    expect(priorityDecoys).toHaveLength(9);
  });

  test("throws when the scenario references an unknown rubric", () => {
    const orphan: Scenario = { ...DISTRESS_SCENARIO, rubricId: "v1/does-not-exist" };
    expect(() => materializeScenario(orphan, RUBRICS)).toThrow(/v1\/does-not-exist/);
  });

  test("throws when the rubric has no sequenceParts", () => {
    const noParts: RubricsById = { "v1/distress": { ...DISTRESS, sequenceParts: [] } };
    expect(() => materializeScenario(DISTRESS_SCENARIO, noParts)).toThrow(/sequenceParts/);
  });

  test("throws when every sequence part is empty after materialization", () => {
    const allEmpty: RubricsById = {
      "v1/distress": {
        ...DISTRESS,
        sequenceParts: [
          { id: "dsc_phase_a", label: "A", items: [] },
          { id: "dsc_phase_b", label: "B", items: [] },
        ],
      },
    };
    expect(() => materializeScenario(DISTRESS_SCENARIO, allEmpty)).toThrow(
      /no spoken-message parts/,
    );
  });
});
