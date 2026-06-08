import { describe, expect, test } from "vite-plus/test";
import { gradeProcedure } from "./grade-procedure.ts";
import type { DscPanelState, ScenarioDsc } from "./types.ts";

const FIRE: ScenarioDsc = {
  state: "required",
  callType: "distress",
  nature: "fire",
  channel: 16,
  power: "high",
  epirb: true,
};

const PERFECT_FIRE: DscPanelState = {
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

function field(result: ReturnType<typeof gradeProcedure>, id: string) {
  return result.fields.find((f) => f.id === id);
}

describe("gradeProcedure — required distress", () => {
  test("a perfect configuration is all-correct and not a critical failure", () => {
    const grade = gradeProcedure(FIRE, PERFECT_FIRE);
    expect(grade.correct).toBe(grade.total);
    expect(grade.total).toBe(5); // call_type, nature, epirb, channel, power
    expect(grade.status).toBe("pass");
    expect(grade.criticalFailure).toBe(false);
    expect(grade.fields.every((f) => f.correct)).toBe(true);
  });

  test("not sending any DSC alert fails the call type and nature, and is critical", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, dscActivated: false });
    expect(field(grade, "call_type")!.correct).toBe(false);
    expect(field(grade, "call_type")!.detail).toMatch(/no DSC alert sent/i);
    expect(field(grade, "nature")!.correct).toBe(false);
    expect(field(grade, "nature")!.detail).toMatch(/no alert sent/i);
    expect(grade.criticalFailure).toBe(true);
  });

  test("sending the wrong call type fails the call type and is critical", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, callType: "individual" });
    expect(field(grade, "call_type")!.correct).toBe(false);
    expect(field(grade, "call_type")!.detail).toMatch(/expected Distress/i);
    expect(grade.criticalFailure).toBe(true);
    // The nature field for a distress Scenario is still present.
    expect(field(grade, "nature")).toBeTruthy();
  });

  test("an acceptable nature riding on the wrong call type earns no nature credit", () => {
    // panel.nature is acceptable, but it was attached to an Individual call.
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, callType: "all_ships", nature: "fire" });
    expect(field(grade, "nature")!.correct).toBe(false);
  });

  test("a wrong nature is reported with sent-vs-expected detail", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, nature: "collision" });
    const nature = field(grade, "nature")!;
    expect(nature.correct).toBe(false);
    expect(nature.detail).toContain("Collision");
    expect(nature.detail).toContain("Fire");
    // A wrong nature is not a critical failure — the call type was still correct.
    expect(grade.criticalFailure).toBe(false);
  });

  test("an acceptable alternate nature is graded correct", () => {
    const sinking: ScenarioDsc = { ...FIRE, nature: "sinking", acceptableNatures: ["flooding"] };
    const grade = gradeProcedure(sinking, { ...PERFECT_FIRE, nature: "flooding" });
    expect(field(grade, "nature")!.correct).toBe(true);
    expect(grade.criticalFailure).toBe(false);
  });

  test("EPIRB is graded against the expected state (on for own-ship distress)", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, epirb: false });
    expect(field(grade, "epirb")!.correct).toBe(false);
    expect(field(grade, "epirb")!.detail).toMatch(/should be ON/i);
  });

  test("EPIRB expected OFF (man overboard): leaving it off is correct, turning it on is wrong", () => {
    const mob: ScenarioDsc = { ...FIRE, nature: "mob", epirb: false };
    expect(
      field(gradeProcedure(mob, { ...PERFECT_FIRE, nature: "mob", epirb: false }), "epirb")!
        .correct,
    ).toBe(true);
    const wrong = gradeProcedure(mob, { ...PERFECT_FIRE, nature: "mob", epirb: true });
    expect(field(wrong, "epirb")!.correct).toBe(false);
    expect(field(wrong, "epirb")!.detail).toMatch(/should be OFF/i);
  });

  test("a wrong working channel reports used-vs-expected", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, channel: 6 });
    const channel = field(grade, "channel")!;
    expect(channel.correct).toBe(false);
    expect(channel.detail).toContain("used 6");
    expect(channel.detail).toContain("Channel 16");
  });

  test("a missing working channel reports an em dash for the selection", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, channel: null });
    expect(field(grade, "channel")!.detail).toContain("used —");
  });

  test("low transmit power is the mistake", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, power: "low" });
    const power = field(grade, "power")!;
    expect(power.correct).toBe(false);
    expect(power.detail).toMatch(/expected High/i);
  });
});

describe("gradeProcedure — conditional equipment", () => {
  test("spare antenna is graded when the Scenario expects it", () => {
    const dismasted: ScenarioDsc = { ...FIRE, nature: "disabled", spareAntenna: true };
    const off = gradeProcedure(dismasted, {
      ...PERFECT_FIRE,
      nature: "disabled",
      spareAntenna: false,
    });
    expect(field(off, "spare_antenna")!.correct).toBe(false);
    const on = gradeProcedure(dismasted, {
      ...PERFECT_FIRE,
      nature: "disabled",
      spareAntenna: true,
    });
    expect(field(on, "spare_antenna")!.correct).toBe(true);
  });

  test("spare antenna is omitted from the checklist when neither expected nor toggled", () => {
    const grade = gradeProcedure(FIRE, PERFECT_FIRE);
    expect(field(grade, "spare_antenna")).toBeUndefined();
  });

  test("wrongly rigging the spare antenna is surfaced and penalised", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, spareAntenna: true });
    expect(field(grade, "spare_antenna")!.correct).toBe(false);
    expect(field(grade, "spare_antenna")!.detail).toMatch(/should be OFF/i);
  });

  test("grab-bag to liferaft is graded when the Scenario expects abandonment", () => {
    const abandon: ScenarioDsc = { ...FIRE, nature: "abandoning", abandon: true };
    const off = gradeProcedure(abandon, { ...PERFECT_FIRE, nature: "abandoning", abandon: false });
    expect(field(off, "abandon")!.correct).toBe(false);
    const on = gradeProcedure(abandon, { ...PERFECT_FIRE, nature: "abandoning", abandon: true });
    expect(field(on, "abandon")!.correct).toBe(true);
    expect(on.status).toBe("pass");
  });

  test("a partially-correct configuration reports partial status", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, power: "low" });
    expect(grade.status).toBe("partial");
    expect(grade.correct).toBe(grade.total - 1);
  });
});
