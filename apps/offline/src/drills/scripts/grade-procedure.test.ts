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

/** An untouched panel: nothing activated, no call configured. */
const IDLE_PANEL: DscPanelState = {
  epirb: false,
  spareAntenna: false,
  abandon: false,
  power: "high",
  channel: null,
  dscActivated: false,
  callType: null,
  nature: null,
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
    expect(grade.criticalReason).toMatch(/no DSC alert sent/i);
  });

  test("sending the wrong call type fails the call type and is critical", () => {
    const grade = gradeProcedure(FIRE, { ...PERFECT_FIRE, callType: "individual" });
    expect(field(grade, "call_type")!.correct).toBe(false);
    expect(field(grade, "call_type")!.detail).toMatch(/expected Distress/i);
    expect(grade.criticalFailure).toBe(true);
    expect(grade.criticalReason).toMatch(/Distress was required/i);
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

describe("gradeProcedure — All Ships precedence", () => {
  const SECURITE: ScenarioDsc = {
    state: "required",
    callType: "all_ships",
    priority: "safety",
    channel: 16,
    power: "high",
    epirb: false,
  };

  const PERFECT_SECURITE: DscPanelState = {
    epirb: false,
    spareAntenna: false,
    abandon: false,
    power: "high",
    channel: 16,
    dscActivated: true,
    callType: "all_ships",
    nature: null,
    priority: "safety",
    addressee: null,
  };

  test("a correct All Ships safety call grades precedence and carries no nature field", () => {
    const grade = gradeProcedure(SECURITE, PERFECT_SECURITE);
    expect(field(grade, "priority")!.correct).toBe(true);
    expect(field(grade, "priority")!.detail).toBe("Safety");
    // Broadcast calls have no nature of distress.
    expect(field(grade, "nature")).toBeUndefined();
    expect(grade.total).toBe(5); // call_type, priority, epirb, channel, power
    expect(grade.correct).toBe(5);
    expect(grade.status).toBe("pass");
    expect(grade.criticalFailure).toBe(false);
  });

  test("an urgency All Ships call grades its precedence", () => {
    const urgency: ScenarioDsc = { ...SECURITE, priority: "urgency" };
    const grade = gradeProcedure(urgency, { ...PERFECT_SECURITE, priority: "urgency" });
    expect(field(grade, "priority")!.correct).toBe(true);
    expect(field(grade, "priority")!.detail).toBe("Urgency");
  });

  test("the wrong precedence is reported sent-vs-expected and is not critical", () => {
    const grade = gradeProcedure(SECURITE, { ...PERFECT_SECURITE, priority: "urgency" });
    const priority = field(grade, "priority")!;
    expect(priority.correct).toBe(false);
    expect(priority.detail).toContain("Urgency");
    expect(priority.detail).toContain("Safety");
    // A wrong precedence is not critical — the call type was still correct.
    expect(grade.criticalFailure).toBe(false);
  });

  test("a correct precedence riding on the wrong call type earns no credit and is critical", () => {
    // Sending a Distress alert where an All Ships call was required is the
    // critical error; the otherwise-correct precedence must not rescue it.
    const grade = gradeProcedure(SECURITE, { ...PERFECT_SECURITE, callType: "distress" });
    expect(field(grade, "priority")!.correct).toBe(false);
    expect(grade.criticalFailure).toBe(true);
  });

  test("not sending any alert fails the precedence with a no-alert detail and is critical", () => {
    const grade = gradeProcedure(SECURITE, { ...PERFECT_SECURITE, dscActivated: false });
    expect(field(grade, "priority")!.correct).toBe(false);
    expect(field(grade, "priority")!.detail).toMatch(/no alert sent/i);
    expect(grade.criticalFailure).toBe(true);
  });
});

describe("gradeProcedure — Individual calls", () => {
  const TR: ScenarioDsc = {
    state: "required",
    callType: "individual",
    priority: "routine",
    addressee: "haifa_radio",
    channel: 26,
    power: "high",
    epirb: false,
  };

  const PERFECT_TR: DscPanelState = {
    epirb: false,
    spareAntenna: false,
    abandon: false,
    power: "high",
    channel: 26,
    dscActivated: true,
    callType: "individual",
    nature: null,
    priority: "routine",
    addressee: "haifa_radio",
  };

  test("a correct Individual call grades addressee, precedence, and proposed channel; no nature", () => {
    const grade = gradeProcedure(TR, PERFECT_TR);
    expect(field(grade, "addressee")!.correct).toBe(true);
    expect(field(grade, "addressee")!.detail).toBe("Haifa Radio");
    expect(field(grade, "priority")!.correct).toBe(true);
    expect(field(grade, "channel")!.correct).toBe(true);
    expect(field(grade, "nature")).toBeUndefined();
    // call_type, priority, addressee, epirb, channel, power
    expect(grade.total).toBe(6);
    expect(grade.correct).toBe(6);
    expect(grade.status).toBe("pass");
    expect(grade.criticalFailure).toBe(false);
  });

  test("the wrong addressee is reported called-vs-expected and is not critical", () => {
    const grade = gradeProcedure(TR, { ...PERFECT_TR, addressee: "rcc_haifa" });
    const addressee = field(grade, "addressee")!;
    expect(addressee.correct).toBe(false);
    expect(addressee.detail).toContain("RCC Haifa");
    expect(addressee.detail).toContain("Haifa Radio");
    // A wrong addressee is not critical — the call type was still correct.
    expect(grade.criticalFailure).toBe(false);
  });

  test("a wrong proposed channel is reported used-vs-expected", () => {
    const grade = gradeProcedure(TR, { ...PERFECT_TR, channel: 16 });
    const channel = field(grade, "channel")!;
    expect(channel.correct).toBe(false);
    expect(channel.detail).toContain("used 16");
    expect(channel.detail).toContain("Channel 26");
  });

  test("an addressee riding on the wrong call type earns no credit and is critical", () => {
    const grade = gradeProcedure(TR, { ...PERFECT_TR, callType: "all_ships" });
    expect(field(grade, "addressee")!.correct).toBe(false);
    expect(grade.criticalFailure).toBe(true);
  });

  test("not sending any alert fails the addressee with a no-alert detail", () => {
    const grade = gradeProcedure(TR, { ...PERFECT_TR, dscActivated: false });
    expect(field(grade, "addressee")!.correct).toBe(false);
    expect(field(grade, "addressee")!.detail).toMatch(/no alert sent/i);
  });
});

describe("gradeProcedure — forbidden (voice-only)", () => {
  const VOICE_ONLY: ScenarioDsc = {
    state: "forbidden",
    channel: 16,
    power: "high",
    epirb: false,
  };
  // Voice-only done right: Ch 16, high power (the default), and no DSC alert.
  const VOICE_ONLY_OK: DscPanelState = { ...IDLE_PANEL, channel: 16 };

  test("voice-only on Ch 16 at high power with no DSC alert is all-correct", () => {
    const grade = gradeProcedure(VOICE_ONLY, VOICE_ONLY_OK);
    expect(field(grade, "dsc")!.correct).toBe(true);
    expect(field(grade, "dsc")!.detail).toMatch(/voice-only/i);
    expect(field(grade, "channel")!.correct).toBe(true);
    expect(field(grade, "power")!.correct).toBe(true);
    expect(grade.total).toBe(3); // dsc, channel, power
    expect(grade.correct).toBe(3);
    expect(grade.status).toBe("pass");
    expect(grade.criticalFailure).toBe(false);
  });

  test("the voice working channel is still graded once the DSC chip is gone", () => {
    const grade = gradeProcedure(VOICE_ONLY, { ...VOICE_ONLY_OK, channel: 6 });
    expect(field(grade, "channel")!.correct).toBe(false);
    expect(field(grade, "channel")!.detail).toContain("Channel 16");
    expect(field(grade, "power")!.correct).toBe(true);
  });

  test("a false DSC distress alert is wrong and a critical failure", () => {
    const grade = gradeProcedure(VOICE_ONLY, {
      ...VOICE_ONLY_OK,
      dscActivated: true,
      callType: "distress",
      nature: "fire",
    });
    expect(field(grade, "dsc")!.correct).toBe(false);
    expect(field(grade, "dsc")!.detail).toMatch(/none was required/i);
    // Channel/power were right, so the raw score is only partial...
    expect(grade.status).toBe("partial");
    // ...but a false distress alert caps the Scenario at fail (#98).
    expect(grade.criticalFailure).toBe(true);
    expect(grade.criticalReason).toMatch(/false distress alert/i);
  });

  test("a misdirected non-distress DSC call is wrong but NOT a critical failure", () => {
    const grade = gradeProcedure(VOICE_ONLY, {
      ...VOICE_ONLY_OK,
      dscActivated: true,
      callType: "all_ships",
      priority: "safety",
    });
    expect(field(grade, "dsc")!.correct).toBe(false);
    // Wrong, but it doesn't mobilise SAR — scores proportionally, no auto-fail.
    expect(grade.criticalFailure).toBe(false);
    expect(grade.criticalReason).toBeNull();
  });
});

describe("gradeProcedure — permitted (on-scene relay)", () => {
  const ON_SCENE: ScenarioDsc = {
    state: "permitted",
    onScene: true,
    channel: 16,
    power: "high",
    epirb: false,
  };
  // The voice relay done right: Ch 16, high power, no DSC (yet).
  const RELAY_OK: DscPanelState = { ...IDLE_PANEL, channel: 16 };

  test("a correct voice relay with no DSC passes; the DSC alert is neutral (zero-weight)", () => {
    const grade = gradeProcedure(ON_SCENE, RELAY_OK);
    expect(field(grade, "channel")!.correct).toBe(true);
    expect(field(grade, "power")!.correct).toBe(true);
    expect(field(grade, "dsc")!.correct).toBe(true);
    expect(grade.total).toBe(2); // channel + power; the DSC alert carries no weight
    expect(grade.correct).toBe(2);
    expect(grade.status).toBe("pass");
  });

  test("an Undesignated distress alert is allowed and neutral (still 2-weight)", () => {
    const grade = gradeProcedure(ON_SCENE, {
      ...RELAY_OK,
      dscActivated: true,
      callType: "distress",
      nature: "undesignated",
    });
    expect(field(grade, "dsc")!.correct).toBe(true);
    expect(field(grade, "dsc")!.detail).toMatch(/acceptable/i);
    expect(grade.total).toBe(2);
  });

  test("a wrong DSC config is penalised on top of the graded channel/power", () => {
    const grade = gradeProcedure(ON_SCENE, {
      ...RELAY_OK,
      dscActivated: true,
      callType: "distress",
      nature: "fire",
    });
    expect(field(grade, "dsc")!.correct).toBe(false);
    expect(field(grade, "dsc")!.detail).toMatch(/Undesignated/i);
    expect(grade.total).toBe(3); // channel + power + the failed DSC fact
    expect(grade.correct).toBe(2);
    expect(grade.status).toBe("partial");
  });

  test("the voice channel is graded for permitted relays too", () => {
    const grade = gradeProcedure(ON_SCENE, { ...RELAY_OK, channel: 6 });
    expect(field(grade, "channel")!.correct).toBe(false);
  });

  test("without the on-scene flag the leniency is withdrawn — sending the alert is penalised", () => {
    const noFlag: ScenarioDsc = { ...ON_SCENE, onScene: false };
    const sentUndesignated = gradeProcedure(noFlag, {
      ...RELAY_OK,
      dscActivated: true,
      callType: "distress",
      nature: "undesignated",
    });
    expect(field(sentUndesignated, "dsc")!.correct).toBe(false);
    expect(sentUndesignated.total).toBe(3);
    // Sending nothing remains fine (channel + power only).
    const idle = gradeProcedure(noFlag, RELAY_OK);
    expect(field(idle, "dsc")!.correct).toBe(true);
    expect(idle.total).toBe(2);
  });
});
