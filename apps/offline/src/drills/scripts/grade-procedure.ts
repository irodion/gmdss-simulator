import { natureOfDistressLabels, type NatureOfDistress } from "@gmdss-simulator/utils";
import { coastStationName } from "./coast-stations.ts";
import type {
  CallPriority,
  DscPanelState,
  DscPower,
  DimensionStatus,
  ProcedureFieldResult,
  ProcedureGrade,
  ScenarioDsc,
} from "./types.ts";

const POWER_LABELS: Readonly<Record<DscPower, string>> = {
  high: "High (25 W)",
  low: "Low (1 W)",
};

const PRIORITY_LABELS: Readonly<Record<CallPriority, string>> = {
  routine: "Routine",
  safety: "Safety",
  urgency: "Urgency",
};

const CALL_TYPE_LABELS = {
  distress: "Distress",
  individual: "Individual call",
  all_ships: "All Ships call",
} as const;

function statusFor(correct: number, total: number): DimensionStatus {
  if (total === 0 || correct === total) return "pass";
  if (correct === 0) return "fail";
  return "partial";
}

function natureLabel(nature: NatureOfDistress | null): string {
  return nature ? natureOfDistressLabels[nature] : "none";
}

function priorityLabel(priority: CallPriority | null): string {
  return priority ? PRIORITY_LABELS[priority] : "none";
}

function onOff(value: boolean): string {
  return value ? "ON" : "OFF";
}

/**
 * The voice working channel and transmit power are graded in EVERY state — a
 * voice-only ack/relay still goes out on the right channel at the right power,
 * so the panel owns them whether or not a DSC alert is sent.
 */
function channelField(expected: ScenarioDsc, panel: DscPanelState): ProcedureFieldResult {
  const correct = panel.channel === expected.channel;
  return {
    id: "channel",
    label: "Working channel",
    correct,
    detail: correct
      ? `Channel ${expected.channel}`
      : `used ${panel.channel ?? "—"}, expected Channel ${expected.channel}`,
  };
}

function powerField(expected: ScenarioDsc, panel: DscPanelState): ProcedureFieldResult {
  const correct = panel.power === expected.power;
  return {
    id: "power",
    label: "Transmit power",
    correct,
    detail: correct
      ? POWER_LABELS[expected.power]
      : `set ${POWER_LABELS[panel.power]}, expected ${POWER_LABELS[expected.power]}`,
  };
}

/**
 * Grade the trainee's final DSC/equipment panel state against a Scenario's
 * expected configuration, as a checklist of facts (never an ordered sequence —
 * see ADR 0002). Pure: no I/O, no clock, deterministic.
 *
 * Handles all three expectation states:
 * - `required` — a normal DSC call across the Distress (nature), All Ships
 *   (precedence), and Individual (precedence + addressee + channel) families.
 * - `forbidden` — the correct answer is voice-only; ANY DSC activation is wrong.
 * - `permitted` — an on-scene relay MAY send an Undesignated distress alert,
 *   scored neutrally (right thing or nothing both fine; wrong config penalised).
 */
export function gradeProcedure(expected: ScenarioDsc, panel: DscPanelState): ProcedureGrade {
  if (expected.state === "forbidden") return gradeForbidden(expected, panel);
  if (expected.state === "permitted") return gradePermitted(expected, panel);

  const fields: ProcedureFieldResult[] = [];

  // --- DSC call type -------------------------------------------------------
  const expectedCallType = expected.callType ?? "distress";
  const callTypeCorrect = panel.dscActivated && panel.callType === expectedCallType;
  fields.push({
    id: "call_type",
    label: "DSC call type",
    correct: callTypeCorrect,
    detail: callTypeCorrect
      ? `${CALL_TYPE_LABELS[expectedCallType]} alert sent`
      : !panel.dscActivated
        ? `no DSC alert sent — a ${CALL_TYPE_LABELS[expectedCallType]} alert was required`
        : `sent ${CALL_TYPE_LABELS[panel.callType ?? expectedCallType]}, expected ${CALL_TYPE_LABELS[expectedCallType]}`,
  });

  // --- Nature of distress (Distress calls only) ----------------------------
  if (expectedCallType === "distress") {
    const acceptable = new Set<NatureOfDistress>(
      [expected.nature, ...(expected.acceptableNatures ?? [])].filter(
        (n): n is NatureOfDistress => n != null,
      ),
    );
    // Gate on callTypeCorrect (not just dscActivated): a nature only counts when
    // it rode on a correct Distress alert. An acceptable nature attached to a
    // wrong call type (individual / all ships) must not earn nature credit.
    const natureCorrect = callTypeCorrect && panel.nature != null && acceptable.has(panel.nature);
    fields.push({
      id: "nature",
      label: "Nature of distress",
      correct: natureCorrect,
      detail: natureCorrect
        ? natureLabel(panel.nature)
        : !panel.dscActivated
          ? "no alert sent"
          : `sent ${natureLabel(panel.nature)}, expected ${natureLabel(expected.nature ?? null)}`,
    });
  }

  // --- Precedence (All Ships / Individual calls only) ----------------------
  // Broadcast and directed calls carry no nature; their distinguishing fact is
  // the precedence (Routine / Safety / Urgency). Gated on callTypeCorrect for
  // the same reason as nature: a precedence only counts when it rode on the
  // right call type.
  if (expectedCallType !== "distress" && expected.priority != null) {
    const priorityCorrect = callTypeCorrect && panel.priority === expected.priority;
    fields.push({
      id: "priority",
      label: "Precedence",
      correct: priorityCorrect,
      detail: priorityCorrect
        ? priorityLabel(expected.priority)
        : !panel.dscActivated
          ? "no alert sent"
          : `sent ${priorityLabel(panel.priority)}, expected ${priorityLabel(expected.priority)}`,
    });
  }

  // --- Addressee (Individual calls only) -----------------------------------
  // A directed call names a coast station; the broadcast families do not. Gated
  // on callTypeCorrect like the other call-shape facts.
  if (expectedCallType === "individual" && expected.addressee != null) {
    const addresseeCorrect = callTypeCorrect && panel.addressee === expected.addressee;
    fields.push({
      id: "addressee",
      label: "Addressee",
      correct: addresseeCorrect,
      detail: addresseeCorrect
        ? coastStationName(expected.addressee)
        : !panel.dscActivated
          ? "no alert sent"
          : `called ${coastStationName(panel.addressee)}, expected ${coastStationName(expected.addressee)}`,
    });
  }

  // --- EPIRB ---------------------------------------------------------------
  const epirbCorrect = panel.epirb === expected.epirb;
  fields.push({
    id: "epirb",
    label: "EPIRB",
    correct: epirbCorrect,
    detail: epirbCorrect
      ? `EPIRB ${onOff(expected.epirb)}`
      : `EPIRB should be ${onOff(expected.epirb)}`,
  });

  // --- Spare antenna (only when expected or wrongly toggled) ---------------
  const expectedSpare = expected.spareAntenna ?? false;
  if (expectedSpare || panel.spareAntenna) {
    const spareCorrect = panel.spareAntenna === expectedSpare;
    fields.push({
      id: "spare_antenna",
      label: "Spare antenna",
      correct: spareCorrect,
      detail: spareCorrect
        ? `spare antenna ${onOff(expectedSpare)}`
        : `spare antenna should be ${onOff(expectedSpare)}`,
    });
  }

  // --- Abandon to liferaft (only when expected or wrongly toggled) ---------
  const expectedAbandon = expected.abandon ?? false;
  if (expectedAbandon || panel.abandon) {
    const abandonCorrect = panel.abandon === expectedAbandon;
    fields.push({
      id: "abandon",
      label: "Grab-bag to liferaft",
      correct: abandonCorrect,
      detail: abandonCorrect
        ? `take EPIRB / SART / portable VHF ${onOff(expectedAbandon)}`
        : `taking the grab-bag should be ${onOff(expectedAbandon)}`,
    });
  }

  // --- Working channel & transmit power ------------------------------------
  fields.push(channelField(expected, panel));
  fields.push(powerField(expected, panel));

  const correct = fields.filter((f) => f.correct).length;
  const total = fields.length;

  // A wrong or missing required call type is the critical DSC error; gradeScenario
  // caps the overall result at fail when this is set, regardless of voice score
  // (ADR 0002). A later slice extends this to the forbidden-state false-alert path.
  const criticalFailure = expected.state === "required" && !callTypeCorrect;

  return {
    fields,
    correct,
    total,
    status: statusFor(correct, total),
    criticalFailure,
  };
}

/**
 * Forbidden state: the correct answer is voice-only (a liferaft MAYDAY on a
 * portable VHF, a distress acknowledgement, a voice MAYDAY RELAY, an RCC
 * response). The panel stays live because recognising *when not to* transmit is
 * the assessed judgment; any DSC activation is wrong. The voice working channel
 * and power are still graded — the spoken call goes out on Ch 16 at high power.
 *
 * `criticalFailure` stays false in this slice; capping a false distress alert at
 * fail is handled by the critical-failure slice (#98).
 */
function gradeForbidden(expected: ScenarioDsc, panel: DscPanelState): ProcedureGrade {
  const sentDsc = panel.dscActivated;
  const fields: ProcedureFieldResult[] = [
    {
      id: "dsc",
      label: "DSC alert",
      correct: !sentDsc,
      detail: sentDsc
        ? "you sent a DSC alert — none was required here (voice only)"
        : "correctly voice-only — no DSC alert sent",
    },
    channelField(expected, panel),
    powerField(expected, panel),
  ];
  const correct = fields.filter((f) => f.correct).length;
  return {
    fields,
    correct,
    total: fields.length,
    status: statusFor(correct, fields.length),
    criticalFailure: false,
  };
}

/**
 * Permitted state: an on-scene MAYDAY relay (you are at the scene of the
 * casualty) MAY send a DSC distress alert with nature Undesignated. Only the
 * DSC alert is scored neutrally — sending that, or sending nothing, both
 * contribute zero; a *wrong* DSC config is penalised. The leniency is gated by
 * the explicit `onScene` flag, never inferred: without it, only voice-only is
 * acceptable. The voice working channel and power are graded as usual (the
 * spoken relay still goes out on Ch 16 at high power).
 */
function gradePermitted(expected: ScenarioDsc, panel: DscPanelState): ProcedureGrade {
  const onSceneRelayAllowed = expected.onScene === true;
  const sentPermittedAlert =
    panel.dscActivated && panel.callType === "distress" && panel.nature === "undesignated";
  const dscAcceptable = !panel.dscActivated || (onSceneRelayAllowed && sentPermittedAlert);

  const fields: ProcedureFieldResult[] = [
    channelField(expected, panel),
    powerField(expected, panel),
  ];
  const correct = fields.filter((f) => f.correct).length;
  let total = fields.length;

  if (dscAcceptable) {
    // Neutral: a passing field is shown for feedback, but it carries no weight
    // (not added to correct/total), so it cannot lift or lower the score.
    fields.push({
      id: "dsc",
      label: "DSC alert",
      correct: true,
      detail: !panel.dscActivated
        ? "voice relay — no DSC alert needed (acceptable)"
        : "on-scene relay — Undesignated distress alert (acceptable)",
    });
  } else {
    fields.push({
      id: "dsc",
      label: "DSC alert",
      correct: false,
      detail: onSceneRelayAllowed
        ? "if you relay by DSC on-scene, send a Distress alert with nature Undesignated"
        : "no DSC alert was required here — relay by voice",
    });
    total += 1;
  }

  return { fields, correct, total, status: statusFor(correct, total), criticalFailure: false };
}
