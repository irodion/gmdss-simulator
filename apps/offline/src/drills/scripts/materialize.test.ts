import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { materializeScenario, materializeStructural } from "./materialize.ts";
import type { RubricsById, Scenario } from "./types.ts";

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

type SequenceItemSpec = NonNullable<RubricDefinition["sequenceParts"]>[number]["items"][number];

function distressRubric(
  id: string,
  partLabel: string,
  items: readonly SequenceItemSpec[],
): RubricDefinition {
  return {
    id,
    version: "1.0.0",
    category: "distress",
    requiredFields: [],
    prowordRules: [],
    sequenceRules: { fieldOrder: [] },
    channelRules: { requiredChannel: 16, blockChannel70Voice: true },
    sequenceParts: [{ id: "procedure", label: partLabel, items }],
  };
}

const DISTRESS_SART = distressRubric("v1/distress-sart", "MAYDAY procedure (Radar SART)", [
  { id: "mayday", label: "MAYDAY" },
  { id: "mayday", label: "MAYDAY" },
  { id: "mayday", label: "MAYDAY" },
  { id: "sart_addressee", label: "Ship who received my Radar SART" },
  { id: "sart_addressee", label: "Ship who received my Radar SART" },
  { id: "sart_addressee", label: "Ship who received my Radar SART" },
  { id: "vessel", label: "Vessel name" },
  { id: "vessel", label: "Vessel name" },
  { id: "vessel", label: "Vessel name" },
  { id: "assistance", label: "Request immediate assistance" },
  { id: "persons", label: "Persons on board" },
  { id: "over", label: "OVER" },
]);

const DISTRESS_RELATIVE = distressRubric(
  "v1/distress-relative",
  "MAYDAY procedure (sighted ship)",
  [
    { id: "mayday", label: "MAYDAY" },
    { id: "mayday", label: "MAYDAY" },
    { id: "mayday", label: "MAYDAY" },
    { id: "ship_description", label: "Ship description" },
    { id: "ship_description", label: "Ship description" },
    { id: "ship_description", label: "Ship description" },
    { id: "vessel", label: "Vessel name" },
    { id: "vessel", label: "Vessel name" },
    { id: "vessel", label: "Vessel name" },
    { id: "position", label: "Relative bearing" },
    { id: "assistance", label: "Request immediate assistance" },
    { id: "persons", label: "Persons on board" },
    { id: "over", label: "OVER" },
  ],
);

const DISTRESS_RCC_RESPONSE = distressRubric("v1/distress-rcc-response", "MAYDAY response to RCC", [
  { id: "mayday", label: "MAYDAY" },
  { id: "addressee_rcc", label: "RCC station name" },
  { id: "vessel", label: "Responding vessel" },
  { id: "vessel", label: "Responding vessel" },
  { id: "action_request", label: "Action request" },
  { id: "over", label: "OVER" },
]);

const RUBRICS: RubricsById = {
  "v1/distress": DISTRESS,
  "v1/urgency": URGENCY,
  "v1/safety": SAFETY,
  "v1/distress-sart": DISTRESS_SART,
  "v1/distress-relative": DISTRESS_RELATIVE,
  "v1/distress-rcc-response": DISTRESS_RCC_RESPONSE,
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

  test("SART life raft scenario injects vessel and addressee facts", () => {
    const sartScenario: Scenario = {
      id: "sart-albatross",
      priority: "mayday",
      rubricId: "v1/distress-sart",
      brief: "SART activated.",
      facts: {
        vessel: "Albatross life raft",
        sartAddressee: "Ship who received my Radar SART",
        assistance: "Require immediate assistance",
        persons: "4 persons on board",
      },
    };
    const template = materializeScenario(sartScenario, RUBRICS);
    expect(template.parts[0]!.items).toHaveLength(12);
    const items = template.parts[0]!.items;
    expect(
      items.filter((i) => i.id === "vessel").every((i) => i.label === "Albatross life raft"),
    ).toBe(true);
    expect(items.filter((i) => i.id === "sart_addressee")).toHaveLength(3);
    expect(items.find((i) => i.id === "assistance")!.label).toBe("Require immediate assistance");
    expect(items.find((i) => i.id === "persons")!.label).toBe("4 persons on board");
    expect(template.pool.filter((i) => i.id === "pan_pan").length).toBe(3);
    expect(template.pool.filter((i) => i.id === "securite").length).toBe(3);
    expect(template.pool.length).toBe(12 + 6);
  });

  test("relative-bearing scenario injects ship description and side as position", () => {
    const horizonScenario: Scenario = {
      id: "horizon-petrel",
      priority: "mayday",
      rubricId: "v1/distress-relative",
      brief: "Sighted ship.",
      facts: {
        vessel: "Petrel life raft",
        shipDescription: "Red-hulled cargo ship",
        position: "I am on your starboard side",
        assistance: "Require immediate assistance",
        persons: "5 persons on board",
      },
    };
    const template = materializeScenario(horizonScenario, RUBRICS);
    expect(template.parts[0]!.items).toHaveLength(13);
    const items = template.parts[0]!.items;
    expect(
      items
        .filter((i) => i.id === "ship_description")
        .every((i) => i.label === "Red-hulled cargo ship"),
    ).toBe(true);
    expect(items.find((i) => i.id === "position")!.label).toBe("I am on your starboard side");
  });

  test("RCC response scenario uses short non-standard sequence", () => {
    const rccScenario: Scenario = {
      id: "rcc-haifa",
      priority: "mayday",
      rubricId: "v1/distress-rcc-response",
      brief: "Respond to RCC.",
      facts: {
        vessel: "Sea Otter",
        addresseeRcc: "Haifa Rescue Coordination Centre",
        actionRequest: "Send fast ships to the distress area to evacuate the crew",
      },
    };
    const template = materializeScenario(rccScenario, RUBRICS);
    expect(template.parts[0]!.items).toHaveLength(6);
    const items = template.parts[0]!.items;
    expect(items.filter((i) => i.id === "mayday")).toHaveLength(1);
    expect(items.find((i) => i.id === "addressee_rcc")!.label).toBe(
      "Haifa Rescue Coordination Centre",
    );
    expect(items.filter((i) => i.id === "vessel").every((i) => i.label === "Sea Otter")).toBe(true);
    expect(items.find((i) => i.id === "action_request")!.label).toBe(
      "Send fast ships to the distress area to evacuate the crew",
    );
    expect(items.find((i) => i.id === "over")!.label).toBe("OVER");
  });

  test("throws when scenario references a rubric id that is not loaded", () => {
    const orphan: Scenario = {
      id: "orphan",
      priority: "mayday",
      rubricId: "v1/does-not-exist",
      brief: "x",
      facts: { vessel: "X" },
    };
    expect(() => materializeScenario(orphan, RUBRICS)).toThrow(/v1\/does-not-exist/);
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
