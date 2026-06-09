import { describe, expect, test } from "vite-plus/test";
import { gradeScenario } from "./grade.ts";
import type { DscPanelState, ScenarioDsc, SequenceItem, SequenceTemplate } from "./types.ts";

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

  test("misplaced channel-power decoy chip counts as an extra and lowers score", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "vessel", label: "Blue Duck" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "decoy_dsc_ch72_25w", label: "DSC: Channel 72, High 25W" },
      { id: "vessel", label: "Blue Duck" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(3);
    expect(grade.extraCount).toBe(1);
    // 3 / max(3, 4) = 0.75
    expect(grade.score).toBeCloseTo(0.75, 5);
    const decoy = grade.parts[0]?.placements.find((p) => p.placed.id === "decoy_dsc_ch72_25w");
    expect(decoy?.correct).toBe(false);
    expect(decoy?.expected).toBeNull();
  });

  test("misplaced callsign (MMSI) decoy chip counts as an extra and lowers score", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "callsign", label: "MMSI 211 239 680" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    const placed: readonly SequenceItem[] = [
      { id: "mayday", label: "MAYDAY" },
      { id: "decoy_mmsi_coast_002411000", label: "MMSI 002 411 000" },
      { id: "callsign", label: "MMSI 211 239 680" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    expect(grade.correctCount).toBe(3);
    expect(grade.extraCount).toBe(1);
    // 3 / max(3, 4) = 0.75
    expect(grade.score).toBeCloseTo(0.75, 5);
    const decoy = grade.parts[0]?.placements.find(
      (p) => p.placed.id === "decoy_mmsi_coast_002411000",
    );
    expect(decoy?.correct).toBe(false);
    expect(decoy?.expected).toBeNull();
  });

  test("RELAY: perfect placement of own + relayed MMSIs in correct slots scores full credit", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday_relay", label: "MAYDAY RELAY" },
      { id: "callsign", label: "MMSI 428 123 456" },
      { id: "relayed_vessel", label: "Yacht Tami" },
      { id: "relayed_mmsi", label: "MMSI 428 555 222" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    const grade = gradeScenario(tpl, placementsMap(items));
    expect(grade.correctCount).toBe(5);
    expect(grade.extraCount).toBe(0);
    expect(grade.score).toBeCloseTo(1, 5);
  });

  test("RELAY: swapping own MMSI with relayed MMSI drops score below passing", () => {
    const items: readonly SequenceItem[] = [
      { id: "mayday_relay", label: "MAYDAY RELAY" },
      { id: "callsign", label: "MMSI 428 123 456" },
      { id: "relayed_mmsi", label: "MMSI 428 555 222" },
      { id: "over", label: "OVER" },
    ];
    const tpl = template(items);
    // Student placed callsign in the relayed_mmsi slot and vice versa.
    const placed: readonly SequenceItem[] = [
      { id: "mayday_relay", label: "MAYDAY RELAY" },
      { id: "relayed_mmsi", label: "MMSI 428 555 222" },
      { id: "callsign", label: "MMSI 428 123 456" },
      { id: "over", label: "OVER" },
    ];
    const grade = gradeScenario(tpl, placementsMap(placed));
    // LCS aligns mayday_relay + over + one of the two MMSIs (3 correct);
    // the other MMSI chip becomes an extra. 3 / max(4, 4) = 0.75 < 0.80.
    expect(grade.correctCount).toBe(3);
    expect(grade.extraCount).toBe(1);
    expect(grade.score).toBeCloseTo(0.75, 5);
    expect(grade.passed).toBe(false);
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

  test("without panel options, grade.procedure is absent and behaviour is unchanged", () => {
    const tpl = template(DISTRESS_ITEMS);
    const grade = gradeScenario(tpl, placementsMap(DISTRESS_ITEMS));
    expect(grade.procedure).toBeUndefined();
    expect(grade.dimensions.some((d) => d.id === "procedure")).toBe(false);
  });
});

describe("gradeScenario with DSC/equipment panel", () => {
  const VOICE: readonly SequenceItem[] = [
    { id: "mayday", label: "MAYDAY" },
    { id: "vessel", label: "Blue Duck" },
    { id: "over", label: "OVER" },
  ];

  const FIRE_DSC: ScenarioDsc = {
    state: "required",
    callType: "distress",
    nature: "fire",
    channel: 16,
    power: "high",
    epirb: true,
  };

  const PERFECT_PANEL: DscPanelState = {
    epirb: true,
    spareAntenna: false,
    abandon: false,
    power: "high",
    channel: 16,
    dscActivated: true,
    callType: "distress",
    nature: "fire",
    priority: null,
    addressee: null,
  };

  test("folds the panel into a 'DSC & equipment' dimension and the unified score", () => {
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), { dsc: FIRE_DSC, panel: PERFECT_PANEL });
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.label).toBe("DSC & equipment");
    expect(procedure.total).toBe(5);
    expect(procedure.correct).toBe(5);
    expect(grade.procedure).toBeTruthy();
    // 3 voice + 5 panel = 8/8.
    expect(grade.correctCount).toBe(8);
    expect(grade.total).toBe(8);
    expect(grade.score).toBeCloseTo(1, 5);
    expect(grade.passed).toBe(true);
  });

  test("a panel mistake lowers the unified score proportionally across voice + panel", () => {
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: FIRE_DSC,
      panel: { ...PERFECT_PANEL, power: "low" },
    });
    // 3 voice + 4 panel = 7 / 8 = 0.875.
    expect(grade.correctCount).toBe(7);
    expect(grade.score).toBeCloseTo(0.875, 5);
    expect(grade.dimensions.find((d) => d.id === "procedure")!.status).toBe("partial");
    expect(grade.procedure!.fields.find((f) => f.id === "power")!.correct).toBe(false);
  });

  test("panel facts can drag a perfect voice score below the pass threshold", () => {
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: FIRE_DSC,
      panel: {
        ...PERFECT_PANEL,
        dscActivated: false,
        epirb: false,
        power: "low",
        channel: 6,
      },
    });
    // Voice 3/3, panel 0/5 → 3/8 = 0.375.
    expect(grade.score).toBeCloseTo(0.375, 5);
    expect(grade.passed).toBe(false);
  });

  test("the dsc option without a panel is ignored (both are required to fold)", () => {
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), { dsc: FIRE_DSC });
    expect(grade.procedure).toBeUndefined();
  });

  test("a critical DSC failure caps the result at fail even when the numeric score passes", () => {
    // 18 correct voice chips + the 3 still-correct equipment facts score ~91%,
    // but a wrong call type is a critical failure and must force an overall fail.
    const longVoice: SequenceItem[] = Array.from({ length: 18 }, () => ({
      id: "mayday",
      label: "MAYDAY",
    }));
    const tpl = template(longVoice);
    const grade = gradeScenario(tpl, placementsMap(longVoice), {
      dsc: FIRE_DSC,
      panel: { ...PERFECT_PANEL, callType: "individual" }, // wrong call type → criticalFailure
    });
    expect(grade.procedure!.criticalFailure).toBe(true);
    expect(grade.score * 100).toBeGreaterThanOrEqual(80); // numeric score alone would pass
    expect(grade.passed).toBe(false); // …but the critical failure caps it
  });

  test("a forbidden Scenario folds no-DSC + channel + power; a stray alert is penalised", () => {
    const FORBIDDEN_DSC: ScenarioDsc = {
      state: "forbidden",
      channel: 16,
      power: "high",
      epirb: false,
    };
    const tpl = template(VOICE);
    // No DSC, Ch 16, high power → 3 voice + 3 panel = 6/6.
    const ok = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: FORBIDDEN_DSC,
      panel: { ...PERFECT_PANEL, dscActivated: false, callType: null, nature: null },
    });
    expect(ok.correctCount).toBe(6);
    expect(ok.total).toBe(6);
    expect(ok.dimensions.find((d) => d.id === "procedure")!.total).toBe(3);
    expect(ok.passed).toBe(true);

    // A stray distress alert costs the no-DSC fact → 5/6, and (a false distress
    // alert) caps the result at fail even though 5/6 clears the threshold (#98).
    const stray = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: FORBIDDEN_DSC,
      panel: PERFECT_PANEL,
    });
    expect(stray.correctCount).toBe(5);
    expect(stray.score).toBeCloseTo(5 / 6, 5);
    expect(stray.procedure!.fields.find((f) => f.id === "dsc")!.correct).toBe(false);
    expect(stray.procedure!.criticalFailure).toBe(true);
    expect(stray.score * 100).toBeGreaterThanOrEqual(80); // score alone would pass
    expect(stray.passed).toBe(false); // …but the false distress alert caps it

    // A misdirected non-distress call is still penalised, but NOT a critical
    // failure: 5/6, no auto-fail.
    const allShips = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: FORBIDDEN_DSC,
      panel: { ...PERFECT_PANEL, callType: "all_ships", nature: null, priority: "safety" },
    });
    expect(allShips.procedure!.criticalFailure).toBe(false);
    expect(allShips.passed).toBe(true);
  });

  test("a permitted on-scene relay grades channel/power but scores the DSC alert neutrally", () => {
    const PERMITTED_DSC: ScenarioDsc = {
      state: "permitted",
      onScene: true,
      channel: 16,
      power: "high",
      epirb: false,
    };
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: PERMITTED_DSC,
      panel: { ...PERFECT_PANEL, dscActivated: false, callType: null, nature: null },
    });
    // 3 voice + 2 panel (channel + power) = 5/5; the optional DSC alert is neutral.
    expect(grade.correctCount).toBe(5);
    expect(grade.total).toBe(5);
    expect(grade.score).toBeCloseTo(1, 5);
    expect(grade.dimensions.find((d) => d.id === "procedure")!.total).toBe(2);
    expect(grade.procedure!.fields.find((f) => f.id === "dsc")!.correct).toBe(true);
  });

  test("folds an Individual call (addressee + precedence + proposed channel) into the score", () => {
    const TR_DSC: ScenarioDsc = {
      state: "required",
      callType: "individual",
      priority: "routine",
      addressee: "haifa_radio",
      channel: 26,
      power: "high",
      epirb: false,
    };
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: TR_DSC,
      panel: {
        ...PERFECT_PANEL,
        epirb: false,
        callType: "individual",
        nature: null,
        priority: "routine",
        addressee: "haifa_radio",
        channel: 26,
      },
    });
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(6); // call_type, priority, addressee, epirb, channel, power
    expect(procedure.correct).toBe(6);
    expect(grade.procedure!.fields.find((f) => f.id === "addressee")!.correct).toBe(true);
    expect(grade.passed).toBe(true);
  });

  test("folds an All Ships safety call (precedence, no nature) into the unified score", () => {
    const SECURITE_DSC: ScenarioDsc = {
      state: "required",
      callType: "all_ships",
      priority: "safety",
      channel: 16,
      power: "high",
      epirb: false,
    };
    const tpl = template(VOICE);
    const grade = gradeScenario(tpl, placementsMap(VOICE), {
      dsc: SECURITE_DSC,
      panel: {
        ...PERFECT_PANEL,
        epirb: false,
        callType: "all_ships",
        nature: null,
        priority: "safety",
      },
    });
    const procedure = grade.dimensions.find((d) => d.id === "procedure")!;
    expect(procedure.total).toBe(5); // call_type, priority, epirb, channel, power
    expect(procedure.correct).toBe(5);
    expect(grade.procedure!.fields.find((f) => f.id === "priority")!.correct).toBe(true);
    expect(grade.procedure!.fields.some((f) => f.id === "nature")).toBe(false);
    expect(grade.passed).toBe(true);
  });
});
