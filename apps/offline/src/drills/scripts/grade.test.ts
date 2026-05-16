import { describe, expect, test } from "vite-plus/test";
import { gradeScenario } from "./grade.ts";
import type { SequenceItem, SequenceTemplate } from "./types.ts";

function template(items: readonly SequenceItem[]): SequenceTemplate {
  return {
    rubricId: "v1/distress",
    callLabel: "MAYDAY procedure",
    priorityId: "mayday",
    parts: [{ id: "procedure", label: "MAYDAY procedure", items }],
    pool: [],
  };
}

const DISTRESS_ITEMS: readonly SequenceItem[] = [
  { id: "mayday", label: "MAYDAY" },
  { id: "mayday", label: "MAYDAY" },
  { id: "mayday", label: "MAYDAY" },
  { id: "vessel", label: "Blue Duck" },
  { id: "vessel", label: "Blue Duck" },
  { id: "vessel", label: "Blue Duck" },
  { id: "callsign", label: "5BCD2" },
  { id: "mayday", label: "MAYDAY" },
  { id: "vessel", label: "Blue Duck" },
  { id: "position", label: "32°05'N" },
  { id: "nature", label: "Fire" },
  { id: "assistance", label: "Need help" },
  { id: "persons", label: "6 POB" },
  { id: "over", label: "OVER" },
];

const placementsMap = (placed: readonly SequenceItem[]) => new Map([["procedure", [...placed]]]);

describe("gradeScenario", () => {
  test("perfect placement returns passed=true and all dimensions pass", () => {
    const tpl = template(DISTRESS_ITEMS);
    const grade = gradeScenario(tpl, placementsMap(DISTRESS_ITEMS));
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(DISTRESS_ITEMS.length);
    expect(grade.dimensions.every((d) => d.status === "pass")).toBe(true);
    expect(grade.dimensions.map((d) => d.id).sort()).toEqual(
      ["body", "ending", "vessel", "priority"].sort(),
    );
  });

  test("priority dimension fails when wrong priority chip placed in opening slot", () => {
    const tpl = template(DISTRESS_ITEMS);
    const wrongOpening = [...DISTRESS_ITEMS];
    wrongOpening[0] = { id: "pan_pan", label: "PAN-PAN" };
    const grade = gradeScenario(tpl, placementsMap(wrongOpening));
    const priority = grade.dimensions.find((d) => d.id === "priority")!;
    expect(priority.status).toBe("partial");
    // 4 mayday slots in the distress fixture; 3 still correct.
    expect(priority.correct).toBe(3);
    expect(priority.total).toBe(4);
  });

  test("vessel dimension reports partial when one vessel slot is wrong", () => {
    const tpl = template(DISTRESS_ITEMS);
    const wrongVessel = [...DISTRESS_ITEMS];
    // slot 4 expects vessel; place position instead
    wrongVessel[3] = { id: "position", label: "wrong" };
    const grade = gradeScenario(tpl, placementsMap(wrongVessel));
    const vessel = grade.dimensions.find((d) => d.id === "vessel")!;
    expect(vessel.status).toBe("partial");
    // 4 vessel slots + 1 callsign slot = 5 vessel-identification slots
    expect(vessel.total).toBe(5);
    expect(vessel.correct).toBe(4);
  });

  test("callsign slots count toward vessel identification dimension", () => {
    const tpl = template(DISTRESS_ITEMS);
    const wrongCallsign = [...DISTRESS_ITEMS];
    // slot 7 expects callsign; place position instead
    wrongCallsign[6] = { id: "position", label: "wrong" };
    const grade = gradeScenario(tpl, placementsMap(wrongCallsign));
    const vessel = grade.dimensions.find((d) => d.id === "vessel")!;
    expect(vessel.status).toBe("partial");
    expect(vessel.total).toBe(5);
    expect(vessel.correct).toBe(4);
  });

  test("ending dimension fails when last slot has wrong id", () => {
    const tpl = template(DISTRESS_ITEMS);
    const wrongEnd = [...DISTRESS_ITEMS];
    wrongEnd[wrongEnd.length - 1] = { id: "out", label: "OUT" };
    const grade = gradeScenario(tpl, placementsMap(wrongEnd));
    const ending = grade.dimensions.find((d) => d.id === "ending")!;
    expect(ending.status).toBe("fail");
    expect(ending.total).toBe(1);
    expect(ending.correct).toBe(0);
  });

  test("body dimension counts position/nature/assistance/persons slots", () => {
    const tpl = template(DISTRESS_ITEMS);
    const grade = gradeScenario(tpl, placementsMap(DISTRESS_ITEMS));
    const body = grade.dimensions.find((d) => d.id === "body")!;
    // position + nature + assistance + persons = 4 body slots
    // (callsign is part of vessel identification, not body).
    expect(body.total).toBe(4);
    expect(body.status).toBe("pass");
  });

  test("SART rubric grades dimensions correctly with new item ids in body", () => {
    const sartItems: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
      { id: "sart_addressee", label: "Ship who received my Radar SART" },
      { id: "sart_addressee", label: "Ship who received my Radar SART" },
      { id: "sart_addressee", label: "Ship who received my Radar SART" },
      { id: "vessel", label: "Albatross life raft" },
      { id: "vessel", label: "Albatross life raft" },
      { id: "vessel", label: "Albatross life raft" },
      { id: "assistance", label: "Require immediate assistance" },
      { id: "persons", label: "4 persons on board" },
      { id: "over", label: "OVER" },
    ];
    const tpl: SequenceTemplate = {
      rubricId: "v1/distress-sart",
      callLabel: "MAYDAY procedure (Radar SART)",
      priorityId: "mayday",
      parts: [{ id: "procedure", label: "MAYDAY procedure (Radar SART)", items: sartItems }],
      pool: [],
    };
    const grade = gradeScenario(tpl, placementsMap(sartItems));
    expect(grade.passed).toBe(true);
    const priority = grade.dimensions.find((d) => d.id === "priority")!;
    const vessel = grade.dimensions.find((d) => d.id === "vessel")!;
    const body = grade.dimensions.find((d) => d.id === "body")!;
    const ending = grade.dimensions.find((d) => d.id === "ending")!;
    expect(priority.total).toBe(3);
    expect(vessel.total).toBe(3);
    expect(body.total).toBe(5);
    expect(ending.total).toBe(1);
  });

  test("safety priorityId scenario uses 'out' as ending", () => {
    const items: readonly SequenceItem[] = [
      { id: "securite", label: "SECURITE" },
      { id: "securite", label: "SECURITE" },
      { id: "securite", label: "SECURITE" },
      { id: "vessel", label: "Cape Runner" },
      { id: "nature", label: "Hazard" },
      { id: "position", label: "32°20'N" },
      { id: "out", label: "OUT" },
    ];
    const tpl: SequenceTemplate = {
      rubricId: "v1/safety",
      callLabel: "SECURITE procedure",
      priorityId: "securite",
      parts: [{ id: "procedure", label: "SECURITE procedure", items }],
      pool: [],
    };
    const grade = gradeScenario(tpl, placementsMap(items));
    const ending = grade.dimensions.find((d) => d.id === "ending")!;
    expect(ending.status).toBe("pass");
    expect(ending.correct).toBe(1);
  });

  test("ship-side distress with procedural items scores procedure dimension 6/6 on perfect run", () => {
    const items: readonly SequenceItem[] = [
      { id: "epirb_on", label: "Turn on EPIRB" },
      { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
      { id: "dsc_time_location", label: "DSC: confirm time and location" },
      { id: "nature_fire", label: "DSC: Fire & Explosion" },
      { id: "dsc_button", label: "DSC: press distress button 5 sec" },
      { id: "dsc_channel16", label: "Radio: Channel 16, High" },
      ...DISTRESS_ITEMS,
    ];
    const tpl = template(items);
    const grade = gradeScenario(tpl, placementsMap(items));
    expect(grade.passed).toBe(true);
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(6);
    expect(procedure.correct).toBe(6);
    expect(procedure.status).toBe("pass");
    expect(grade.dimensions.find((d) => d.id === "priority")!.total).toBe(4);
    expect(grade.dimensions.find((d) => d.id === "vessel")!.total).toBe(5);
    expect(grade.dimensions.find((d) => d.id === "body")!.total).toBe(4);
    expect(grade.dimensions.find((d) => d.id === "ending")!.total).toBe(1);
  });

  test("fallen-mast scenario scores procedure dimension 7/7 with antenna_spare after epirb_on", () => {
    const items: readonly SequenceItem[] = [
      { id: "epirb_on", label: "Turn on EPIRB" },
      { id: "antenna_spare", label: "Rig spare antenna (coax cable)" },
      { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
      { id: "dsc_time_location", label: "DSC: confirm time and location" },
      { id: "nature_disabled", label: "DSC: Disabled & Adrift" },
      { id: "dsc_button", label: "DSC: press distress button 5 sec" },
      { id: "dsc_channel16", label: "Radio: Channel 16, High" },
      ...DISTRESS_ITEMS,
    ];
    const tpl = template(items);
    const grade = gradeScenario(tpl, placementsMap(items));
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(7);
    expect(procedure.correct).toBe(7);
    expect(procedure.status).toBe("pass");
  });

  test("abandoning scenario scores procedure dimension 7/7 with in_raft", () => {
    const items: readonly SequenceItem[] = [
      { id: "epirb_on", label: "Turn on EPIRB" },
      { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
      { id: "dsc_time_location", label: "DSC: confirm time and location" },
      { id: "nature_abandoning", label: "DSC: Abandoning" },
      { id: "dsc_button", label: "DSC: press distress button 5 sec" },
      { id: "dsc_channel16", label: "Radio: Channel 16, High" },
      ...DISTRESS_ITEMS,
      { id: "in_raft", label: "In raft: EPIRB, SART, portable VHF" },
    ];
    const tpl = template(items);
    const grade = gradeScenario(tpl, placementsMap(items));
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(7);
    expect(procedure.correct).toBe(7);
    expect(procedure.status).toBe("pass");
  });

  test("misplacing only procedural items leaves other dimensions passing", () => {
    const correct: readonly SequenceItem[] = [
      { id: "epirb_on", label: "Turn on EPIRB" },
      { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
      { id: "dsc_time_location", label: "DSC: confirm time and location" },
      { id: "nature_fire", label: "DSC: Fire & Explosion" },
      { id: "dsc_button", label: "DSC: press distress button 5 sec" },
      { id: "dsc_channel16", label: "Radio: Channel 16, High" },
      ...DISTRESS_ITEMS,
    ];
    const tpl = template(correct);
    // Swap two procedural items (still procedural ids, just wrong order).
    const placed = [...correct];
    placed[0] = { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" };
    placed[1] = { id: "epirb_on", label: "Turn on EPIRB" };
    const grade = gradeScenario(tpl, placementsMap(placed));
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.status).toBe("partial");
    expect(grade.dimensions.find((d) => d.id === "priority")!.status).toBe("pass");
    expect(grade.dimensions.find((d) => d.id === "vessel")!.status).toBe("pass");
    expect(grade.dimensions.find((d) => d.id === "body")!.status).toBe("pass");
    expect(grade.dimensions.find((d) => d.id === "ending")!.status).toBe("pass");
  });

  test("any acceptableIds value is graded as correct in that slot", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      {
        id: "nature_abandoning",
        label: "DSC: Abandoning",
        acceptableIds: ["nature_flooding", "nature_listing"],
      },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "nature_listing", label: "DSC: Listing & Capsizing" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.passed).toBe(true);
    expect(grade.correctCount).toBe(3);
  });

  test("MEDICO scenario: procedure=6, priority=6, vessel=8, body=15, ending=2 on perfect run", () => {
    // Part 1 voice tally: 3 priority + 3 addressee + 1 this_is + 3 vessel + 1 callsign + 1 position + 1 medico + 1 OVER
    // Part 2 voice tally: 1 working_channel + 3 priority + 3 addressee + 1 this_is + 3 vessel + 1 callsign + 1 position + 3 medical + 1 OVER
    const items: readonly SequenceItem[] = [
      { id: "dsc_channel70", label: "DSC: Channel 70" },
      { id: "dsc_urgency_category", label: "DSC: category Urgency" },
      { id: "dsc_addressee_all_stations", label: "DSC: addressee All Stations" },
      { id: "dsc_time_position", label: "DSC: confirm time and position" },
      { id: "dsc_send_urgency", label: "DSC: send urgency alert" },
      { id: "dsc_channel16", label: "Radio: Channel 16, High" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "this_is", label: "THIS IS" },
      { id: "vessel", label: "Grey Whale" },
      { id: "vessel", label: "Grey Whale" },
      { id: "vessel", label: "Grey Whale" },
      { id: "callsign", label: "MMSI 211 555 200" },
      { id: "position", label: "31°45'N 034°20'E" },
      { id: "medico", label: "MEDICO" },
      { id: "over", label: "OVER" },
      { id: "working_channel_switch", label: "Switch to Ch 24" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "pan_pan", label: "PAN-PAN" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "addressee", label: "RCC Haifa" },
      { id: "this_is", label: "THIS IS" },
      { id: "vessel", label: "Grey Whale" },
      { id: "vessel", label: "Grey Whale" },
      { id: "vessel", label: "Grey Whale" },
      { id: "callsign", label: "MMSI 211 555 200" },
      { id: "position", label: "31°45'N 034°20'E" },
      { id: "patient_vitals", label: "Male, 52" },
      { id: "patient_status", label: "Chest pain" },
      { id: "actions_taken", label: "Aspirin given" },
      { id: "over", label: "OVER" },
    ];
    const tpl: SequenceTemplate = {
      rubricId: "v1/urgency-medico",
      callLabel: "MEDICO procedure",
      priorityId: "pan_pan",
      parts: [
        { id: "procedure", label: "MEDICO procedure", items: items.slice(0, 20) },
        { id: "medical_message", label: "Detailed medical message", items: items.slice(20) },
      ],
      pool: [],
    };
    const placementsByPart = new Map([
      ["procedure", items.slice(0, 20)],
      ["medical_message", items.slice(20)],
    ]);
    const grade = gradeScenario(tpl, placementsByPart);
    expect(grade.passed).toBe(true);
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    const priority = grade.dimensions.find((d) => d.id === "priority")!;
    const vessel = grade.dimensions.find((d) => d.id === "vessel")!;
    const body = grade.dimensions.find((d) => d.id === "body")!;
    const ending = grade.dimensions.find((d) => d.id === "ending")!;
    expect(procedure.total).toBe(6);
    expect(priority.total).toBe(6);
    expect(vessel.total).toBe(8);
    expect(body.total).toBe(15);
    expect(ending.total).toBe(2);
  });

  test("MEDICO: closing OVER folds into ending; patient_* fold into body", () => {
    const items: readonly SequenceItem[] = [
      { id: "patient_vitals", label: "v" },
      { id: "patient_status", label: "s" },
      { id: "actions_taken", label: "a" },
      { id: "over", label: "OVER" },
    ];
    const tpl: SequenceTemplate = {
      rubricId: "v1/urgency-medico",
      callLabel: "MEDICO body-only fixture",
      priorityId: "pan_pan",
      parts: [{ id: "medical_message", label: "x", items }],
      pool: [],
    };
    const grade = gradeScenario(tpl, new Map([["medical_message", items]]));
    const body = grade.dimensions.find((d) => d.id === "body")!;
    const ending = grade.dimensions.find((d) => d.id === "ending")!;
    expect(body.total).toBe(3);
    expect(body.correct).toBe(3);
    expect(ending.total).toBe(1);
    expect(ending.correct).toBe(1);
  });

  test("MEDICO: DSC urgency procedural ids land in procedure dimension", () => {
    const items: readonly SequenceItem[] = [
      { id: "dsc_channel70", label: "x" },
      { id: "dsc_urgency_category", label: "x" },
      { id: "dsc_addressee_all_stations", label: "x" },
      { id: "dsc_time_position", label: "x" },
      { id: "dsc_send_urgency", label: "x" },
      { id: "dsc_channel16", label: "x" },
    ];
    const tpl: SequenceTemplate = {
      rubricId: "v1/urgency-medico",
      callLabel: "DSC fixture",
      priorityId: "pan_pan",
      parts: [{ id: "procedure", label: "x", items }],
      pool: [],
    };
    const grade = gradeScenario(tpl, new Map([["procedure", items]]));
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(6);
    expect(procedure.correct).toBe(6);
    expect(procedure.status).toBe("pass");
  });

  test("non-acceptable nature code in an acceptable slot is graded wrong", () => {
    const items: readonly SequenceItem[] = [
      {
        id: "nature_abandoning",
        label: "DSC: Abandoning",
        acceptableIds: ["nature_flooding"],
      },
    ];
    const tpl = template(items);
    const placed: readonly SequenceItem[] = [{ id: "nature_fire", label: "DSC: Fire & Explosion" }];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.passed).toBe(false);
    expect(grade.correctCount).toBe(0);
  });

  test("empty student list yields score=0, passed=false, and full missing list", () => {
    const tpl = template(DISTRESS_ITEMS);
    const grade = gradeScenario(tpl, placementsMap([]));
    expect(grade.correctCount).toBe(0);
    expect(grade.total).toBe(DISTRESS_ITEMS.length);
    expect(grade.score).toBe(0);
    expect(grade.passed).toBe(false);
    expect(grade.extraCount).toBe(0);
    expect(grade.parts[0]?.placements).toHaveLength(0);
    expect(grade.parts[0]?.missing).toHaveLength(DISTRESS_ITEMS.length);
  });

  test("forgotten middle step still scores surrounding items via LCS", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "vessel", label: "Blue Duck" },
      { id: "position", label: "32°05'N" },
      { id: "nature", label: "Fire" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    // Student forgot the middle "position" step.
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "vessel", label: "Blue Duck" },
      { id: "nature", label: "Fire" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(4);
    expect(grade.parts[0]?.placements.every((p) => p.correct)).toBe(true);
    expect(grade.parts[0]?.missing.map((m) => m.id)).toEqual(["position"]);
    // 4/5 = 80% — at threshold.
    expect(grade.score).toBeCloseTo(0.8, 5);
    expect(grade.passed).toBe(true);
  });

  test("extra noise entries reduce score and are flagged as not correct", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "vessel", label: "Blue Duck" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    // Student placed all correct items + 2 random extras.
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "position", label: "noise" },
      { id: "vessel", label: "Blue Duck" },
      { id: "nature", label: "noise" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(3);
    expect(grade.extraCount).toBe(2);
    // 3 / max(3, 5) = 0.6 — below threshold.
    expect(grade.score).toBeCloseTo(0.6, 5);
    expect(grade.passed).toBe(false);
    const noise = grade.parts[0]?.placements.filter((p) => !p.correct) ?? [];
    expect(noise).toHaveLength(2);
    expect(noise.every((p) => p.expected === null)).toBe(true);
  });

  test("score boundary: just below 80% does not pass", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
      { id: "vessel", label: "v" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    // Only 3 of 5 correct → 60%.
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
      { id: "mayday", label: "MAYDAY" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(3);
    expect(grade.score).toBeCloseTo(0.6, 5);
    expect(grade.passed).toBe(false);
  });

  test("score at exactly 80% passes", () => {
    const items: readonly SequenceItem[] = Array.from({ length: 10 }, () => ({
      id: "mayday",
      label: "MAYDAY",
    }));
    const tpl = template(items);
    // 8 of 10 placed in order → 80%.
    const placed: readonly SequenceItem[] = items.slice(0, 8);
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(8);
    expect(grade.score).toBeCloseTo(0.8, 5);
    expect(grade.passed).toBe(true);
  });
});
