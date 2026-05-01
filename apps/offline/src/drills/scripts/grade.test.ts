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
});
