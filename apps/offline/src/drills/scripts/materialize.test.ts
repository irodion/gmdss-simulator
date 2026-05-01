import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { materializeScenario, materializeStructural } from "./materialize.ts";
import type { RubricsByPriority, Scenario } from "./types.ts";

const DISTRESS: RubricDefinition = {
  id: "v1/distress",
  version: "1.0.0",
  category: "distress",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: ["mayday", "vessel_name", "position", "nature", "over"] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Vessel name" },
        { id: "position", label: "Position" },
        { id: "nature", label: "Nature of distress" },
        { id: "assistance", label: "Request immediate assistance" },
        { id: "persons", label: "Persons on board" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
};

const URGENCY: RubricDefinition = {
  id: "v1/urgency",
  version: "1.0.0",
  category: "urgency",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "PAN-PAN procedure",
      items: [
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "position", label: "Position" },
        { id: "nature", label: "Nature of urgency" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
};

const SAFETY: RubricDefinition = {
  id: "v1/safety",
  version: "1.0.0",
  category: "safety",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "SECURITE procedure",
      items: [
        { id: "securite", label: "SECURITE" },
        { id: "securite", label: "SECURITE" },
        { id: "securite", label: "SECURITE" },
        { id: "vessel", label: "Vessel name" },
        { id: "nature", label: "Nature of safety message" },
        { id: "position", label: "Position / area" },
        { id: "out", label: "OUT" },
      ],
    },
  ],
};

const RUBRICS: RubricsByPriority = {
  mayday: DISTRESS,
  pan_pan: URGENCY,
  securite: SAFETY,
};

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
};

describe("materializeScenario", () => {
  test("substitutes scenario facts into the chip labels", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const items = template.parts[0]!.items;
    expect(items.find((i) => i.id === "vessel")!.label).toBe("Blue Duck");
    expect(items.find((i) => i.id === "position")!.label).toBe("32°05'N 034°45'E");
    expect(items.find((i) => i.id === "nature")!.label).toBe("Engine room fire");
    expect(items.find((i) => i.id === "callsign")!.label).toBe("5BCD2");
    expect(items.find((i) => i.id === "persons")!.label).toBe("6 persons on board");
    // Fixed phrases retain their literal labels.
    expect(items.find((i) => i.id === "mayday")!.label).toBe("MAYDAY");
    expect(items.find((i) => i.id === "over")!.label).toBe("OVER");
  });

  test("sets priorityId from the scenario", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    expect(template.priorityId).toBe("mayday");
  });

  test("pool contains all correct items plus 3x of each wrong-priority opening", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const correctCount = template.parts.flatMap((p) => p.items).length;
    const panPanInPool = template.pool.filter((i) => i.id === "pan_pan").length;
    const securiteInPool = template.pool.filter((i) => i.id === "securite").length;
    expect(panPanInPool).toBe(3);
    expect(securiteInPool).toBe(3);
    expect(template.pool.length).toBe(correctCount + 6);
  });

  test("uses the correct rubric for each priority", () => {
    const urgencyScenario: Scenario = {
      id: "engine-failure",
      priority: "pan_pan",
      rubricId: "v1/urgency",
      brief: "Engine failure.",
      facts: {
        vessel: "Red Fox",
        callsign: "5RFX1",
        position: "32°15'N 034°40'E",
        nature: "Engine failure",
      },
    };
    const template = materializeScenario(urgencyScenario, RUBRICS);
    expect(template.rubricId).toBe("v1/urgency");
    expect(template.parts[0]!.items.length).toBe(URGENCY.sequenceParts![0]!.items.length);
    // Wrong-priority decoys should be MAYDAY and SECURITE, not PAN-PAN.
    expect(template.pool.filter((i) => i.id === "mayday").length).toBe(3);
    expect(template.pool.filter((i) => i.id === "securite").length).toBe(3);
  });

  test("safety scenario falls back to fixed labels when optional facts are absent", () => {
    const safetyScenario: Scenario = {
      id: "container",
      priority: "securite",
      rubricId: "v1/safety",
      brief: "Floating container.",
      facts: {
        vessel: "Cape Runner",
        position: "32°20'N 034°50'E",
        nature: "Floating container",
      },
    };
    const template = materializeScenario(safetyScenario, RUBRICS);
    const items = template.parts[0]!.items;
    expect(items.find((i) => i.id === "out")!.label).toBe("OUT");
    expect(items.find((i) => i.id === "vessel")!.label).toBe("Cape Runner");
  });
});

describe("materializeStructural (legacy)", () => {
  test("preserves rubric.sequenceParts in the template", () => {
    const template = materializeStructural(DISTRESS);
    expect(template.rubricId).toBe("v1/distress");
    expect(template.parts[0]!.items).toHaveLength(14);
    expect(template.priorityId).toBe("mayday");
  });

  test("throws when sequenceParts is missing", () => {
    const noParts: RubricDefinition = { ...DISTRESS, sequenceParts: undefined };
    expect(() => materializeStructural(noParts)).toThrow(/sequenceParts/);
  });
});
