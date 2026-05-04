import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { materializeScenario, materializeStructural } from "./materialize.ts";
import { isNatureItem, type RubricsById, type Scenario } from "./types.ts";

const DISTRESS: RubricDefinition = {
  id: "v1/distress",
  version: "1.2.0",
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
        { id: "epirb_on", label: "Turn on EPIRB" },
        { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
        { id: "dsc_time_location", label: "DSC: confirm time and location" },
        { id: "dsc_nature", label: "DSC:" },
        { id: "dsc_button", label: "DSC: press distress button 5 sec" },
        { id: "dsc_channel16", label: "Radio: Channel 16, High" },
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

const URGENCY_MEDICO: RubricDefinition = {
  id: "v1/urgency-medico",
  version: "1.0.0",
  category: "urgency",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
  sequenceParts: [
    {
      id: "procedure",
      label: "MEDICO procedure (DSC + Ch 16 voice call)",
      items: [
        { id: "dsc_channel70", label: "DSC: Channel 70" },
        { id: "dsc_urgency_category", label: "DSC: category Urgency" },
        { id: "dsc_addressee_all_stations", label: "DSC: All Ships call" },
        { id: "dsc_time_position", label: "DSC: confirm time and position" },
        { id: "dsc_send_urgency", label: "DSC: send urgency alert" },
        { id: "dsc_channel16", label: "Radio: Channel 16, High" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "this_is", label: "THIS IS" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "position", label: "Position" },
        { id: "medico", label: "MEDICO / Need medical advice" },
        { id: "over", label: "OVER" },
      ],
    },
    {
      id: "medical_message",
      label: "Detailed medical message (working channel)",
      items: [
        { id: "working_channel_switch", label: "Switch to working channel (e.g., Ch 24)" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "pan_pan", label: "PAN-PAN" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "addressee", label: "Addressee (All Stations / RCC)" },
        { id: "this_is", label: "THIS IS" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "vessel", label: "Vessel name" },
        { id: "callsign", label: "Callsign / MMSI" },
        { id: "position", label: "Position" },
        { id: "patient_vitals", label: "Patient vitals (gender, age, temp, BP)" },
        { id: "patient_status", label: "Patient status / problem" },
        { id: "actions_taken", label: "Actions taken / treatment given" },
        { id: "medico_ends", label: "Medico message ends, Over" },
      ],
    },
  ],
};

const RUBRICS: RubricsById = {
  "v1/distress": DISTRESS,
  "v1/urgency": URGENCY,
  "v1/safety": SAFETY,
  "v1/distress-sart": DISTRESS_SART,
  "v1/distress-relative": DISTRESS_RELATIVE,
  "v1/distress-rcc-response": DISTRESS_RCC_RESPONSE,
  "v1/urgency-medico": URGENCY_MEDICO,
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
    natureCode: "nature_fire",
  },
};

const MEDICO_SCENARIO: Scenario = {
  id: "medico-grey-whale",
  priority: "pan_pan",
  rubricId: "v1/urgency-medico",
  brief: "Cardiac event onboard.",
  facts: {
    vessel: "Grey Whale",
    callsign: "MMSI 211 555 200",
    position: "31°45'N 034°20'E",
    addressee: "RCC Haifa",
    patientVitals: "Male, age 52, temperature 37.2°C, BP 160/100",
    patientStatus: "Severe chest pain, conscious but very weak",
    actionsTaken: "Aspirin administered, oxygen rigged",
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

  test("pool contains all correct items plus 3x of each wrong-priority opening and 4 nature decoys", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const correctCount = template.parts.flatMap((p) => p.items).length;
    const panPanInPool = template.pool.filter((i) => i.id === "pan_pan").length;
    const securiteInPool = template.pool.filter((i) => i.id === "securite").length;
    expect(panPanInPool).toBe(3);
    expect(securiteInPool).toBe(3);
    // 6 priority decoys + 4 nature decoys (the correct nature is counted in correctCount)
    expect(template.pool.length).toBe(correctCount + 6 + 4);
  });

  test("ship-side distress scenario produces 20 slots ending with OVER, procedural items first", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const items = template.parts[0]!.items;
    expect(items).toHaveLength(20);
    expect(items.slice(0, 6).map((i) => i.id)).toEqual([
      "epirb_on",
      "dsc_channel70",
      "dsc_time_location",
      "nature_fire",
      "dsc_button",
      "dsc_channel16",
    ]);
    expect(items[19]!.id).toBe("over");
  });

  test("dsc_nature slot is materialized with the scenario nature code id and label", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const natureSlot = template.parts[0]!.items[3]!;
    expect(natureSlot.id).toBe("nature_fire");
    expect(natureSlot.label).toBe("DSC: Fire & Explosion");
  });

  test("requiresAbandon scenario appends in_raft slot and chip", () => {
    const abandon: Scenario = {
      ...DISTRESS_SCENARIO,
      id: "abandon-river-hawk",
      requiresAbandon: true,
      facts: { ...DISTRESS_SCENARIO.facts, natureCode: "nature_abandoning" },
    };
    const template = materializeScenario(abandon, RUBRICS);
    const items = template.parts[0]!.items;
    expect(items).toHaveLength(21);
    expect(items[20]!.id).toBe("in_raft");
    expect(items[20]!.label).toBe("In raft: EPIRB, SART, portable VHF");
    expect(template.pool.filter((i) => i.id === "in_raft").length).toBe(1);
  });

  test("non-abandon scenario has no in_raft chip in pool", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    expect(template.pool.filter((i) => i.id === "in_raft").length).toBe(0);
  });

  test("pool contains exactly the correct nature chip plus 4 nature decoys", () => {
    const template = materializeScenario(DISTRESS_SCENARIO, RUBRICS);
    const natureChips = template.pool.filter((i) => isNatureItem(i.id));
    expect(natureChips).toHaveLength(5);
    expect(natureChips.filter((i) => i.id === "nature_fire")).toHaveLength(1);
    // Decoys must not duplicate the correct one.
    const decoys = natureChips.filter((i) => i.id !== "nature_fire");
    expect(decoys).toHaveLength(4);
    expect(new Set(decoys.map((i) => i.id)).size).toBe(4);
  });

  test("acceptable nature codes are stamped on dsc_nature slot and added as pool chips", () => {
    const aurora: Scenario = {
      ...DISTRESS_SCENARIO,
      id: "abandon-aurora",
      requiresAbandon: true,
      facts: {
        ...DISTRESS_SCENARIO.facts,
        natureCode: "nature_abandoning",
        acceptableNatureCodes: ["nature_flooding", "nature_listing", "nature_grounding"],
      },
    };
    const template = materializeScenario(aurora, RUBRICS);
    const natureSlot = template.parts[0]!.items[3]!;
    expect(natureSlot.id).toBe("nature_abandoning");
    expect(natureSlot.acceptableIds).toEqual([
      "nature_flooding",
      "nature_listing",
      "nature_grounding",
    ]);
    // All acceptable chips are pickable from the pool (canonical via correctItems,
    // others as extras), so the student can land on any one.
    for (const code of [
      "nature_abandoning",
      "nature_flooding",
      "nature_listing",
      "nature_grounding",
    ]) {
      expect(template.pool.filter((i) => i.id === code)).toHaveLength(1);
    }
  });

  test("nature decoys exclude every acceptable code, not just the canonical one", () => {
    const aurora: Scenario = {
      ...DISTRESS_SCENARIO,
      id: "abandon-aurora-decoy-check",
      facts: {
        ...DISTRESS_SCENARIO.facts,
        natureCode: "nature_abandoning",
        acceptableNatureCodes: ["nature_flooding", "nature_listing", "nature_grounding"],
      },
    };
    const template = materializeScenario(aurora, RUBRICS);
    const acceptable = new Set([
      "nature_abandoning",
      "nature_flooding",
      "nature_listing",
      "nature_grounding",
    ]);
    const natureChips = template.pool.filter((i) => isNatureItem(i.id));
    // Total = 4 acceptable (1 canonical + 3 extras) + 4 distractors = 8.
    expect(natureChips).toHaveLength(8);
    const decoys = natureChips.filter((i) => !acceptable.has(i.id));
    expect(decoys).toHaveLength(4);
    expect(new Set(decoys.map((i) => i.id)).size).toBe(4);
  });

  test("does not add nature decoys when rubric has no dsc_nature slot, even if facts.natureCode is set", () => {
    const sartScenario: Scenario = {
      id: "sart-with-stray-nature-code",
      priority: "mayday",
      rubricId: "v1/distress-sart",
      brief: "SART activated.",
      facts: {
        vessel: "Albatross life raft",
        sartAddressee: "Ship who received my Radar SART",
        assistance: "Require immediate assistance",
        persons: "4 persons on board",
        natureCode: "nature_fire",
      },
    };
    const template = materializeScenario(sartScenario, RUBRICS);
    expect(template.pool.filter((i) => isNatureItem(i.id))).toHaveLength(0);
  });

  test("throws when v1/distress scenario is missing facts.natureCode", () => {
    const broken: Scenario = {
      id: "broken",
      priority: "mayday",
      rubricId: "v1/distress",
      brief: "x",
      facts: {
        vessel: "X",
        callsign: "X",
        position: "X",
        nature: "X",
        assistance: "X",
        persons: "X",
      },
    };
    expect(() => materializeScenario(broken, RUBRICS)).toThrow(/natureCode/);
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
        addresseeRcc: "RCC Haifa",
        actionRequest: "Send fast ships to the distress area to evacuate the crew",
      },
    };
    const template = materializeScenario(rccScenario, RUBRICS);
    expect(template.parts[0]!.items).toHaveLength(6);
    const items = template.parts[0]!.items;
    expect(items.filter((i) => i.id === "mayday")).toHaveLength(1);
    expect(items.find((i) => i.id === "addressee_rcc")!.label).toBe("RCC Haifa");
    expect(items.filter((i) => i.id === "vessel").every((i) => i.label === "Sea Otter")).toBe(true);
    expect(items.find((i) => i.id === "action_request")!.label).toBe(
      "Send fast ships to the distress area to evacuate the crew",
    );
    expect(items.find((i) => i.id === "over")!.label).toBe("OVER");
  });

  test("MEDICO scenario produces two parts with the canonical chip counts", () => {
    const template = materializeScenario(MEDICO_SCENARIO, RUBRICS);
    expect(template.parts).toHaveLength(2);
    expect(template.parts[0]!.id).toBe("procedure");
    expect(template.parts[1]!.id).toBe("medical_message");
    expect(template.parts[0]!.items).toHaveLength(20);
    expect(template.parts[1]!.items).toHaveLength(17);
  });

  test("MEDICO materializer injects addressee × 3 in both parts", () => {
    const template = materializeScenario(MEDICO_SCENARIO, RUBRICS);
    const part1Addressees = template.parts[0]!.items.filter((i) => i.id === "addressee");
    const part2Addressees = template.parts[1]!.items.filter((i) => i.id === "addressee");
    expect(part1Addressees).toHaveLength(3);
    expect(part2Addressees).toHaveLength(3);
    expect(part1Addressees.every((i) => i.label === "RCC Haifa")).toBe(true);
    expect(part2Addressees.every((i) => i.label === "RCC Haifa")).toBe(true);
  });

  test("MEDICO materializer injects MMSI into the callsign chip", () => {
    const template = materializeScenario(
      { ...MEDICO_SCENARIO, facts: { ...MEDICO_SCENARIO.facts, addressee: "All Stations" } },
      RUBRICS,
    );
    const callsigns = template.parts.flatMap((p) => p.items).filter((i) => i.id === "callsign");
    expect(callsigns).toHaveLength(2);
    expect(callsigns.every((i) => i.label === "MMSI 211 555 200")).toBe(true);
  });

  test("MEDICO Part 2 chips carry the injected medical fact text", () => {
    const template = materializeScenario(MEDICO_SCENARIO, RUBRICS);
    const part2 = template.parts[1]!.items;
    expect(part2.find((i) => i.id === "patient_vitals")!.label).toBe(
      "Male, age 52, temperature 37.2°C, BP 160/100",
    );
    expect(part2.find((i) => i.id === "patient_status")!.label).toBe(
      "Severe chest pain, conscious but very weak",
    );
    expect(part2.find((i) => i.id === "actions_taken")!.label).toBe(
      "Aspirin administered, oxygen rigged",
    );
    // working_channel_switch and medico_ends are not in ITEM_TO_FACT_KEY,
    // so they fall back to their rubric-supplied labels.
    expect(part2.find((i) => i.id === "working_channel_switch")!.label).toBe(
      "Switch to working channel (e.g., Ch 24)",
    );
    expect(part2.find((i) => i.id === "medico_ends")!.label).toBe("Medico message ends, Over");
  });

  test("MEDICO pool contains all correct items plus wrong-priority decoys", () => {
    const template = materializeScenario(MEDICO_SCENARIO, RUBRICS);
    const correctCount = template.parts.flatMap((p) => p.items).length;
    // 6 wrong-priority decoys (3 mayday + 3 securite); MEDICO has no dsc_nature slot,
    // so no nature decoys are added.
    expect(template.pool.length).toBe(correctCount + 6);
    expect(template.pool.filter((i) => i.id === "mayday").length).toBe(3);
    expect(template.pool.filter((i) => i.id === "securite").length).toBe(3);
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
    expect(template.parts[0]!.items).toHaveLength(20);
    expect(template.priorityId).toBe("mayday");
  });

  test("throws when sequenceParts is missing", () => {
    const noParts: RubricDefinition = { ...DISTRESS, sequenceParts: undefined };
    expect(() => materializeStructural(noParts)).toThrow(/sequenceParts/);
  });
});
