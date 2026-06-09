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
  if (expected.state === "forbidden") return gradeForbidden(panel);
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

  // --- Working channel -----------------------------------------------------
  const channelCorrect = panel.channel === expected.channel;
  fields.push({
    id: "channel",
    label: "Working channel",
    correct: channelCorrect,
    detail: channelCorrect
      ? `Channel ${expected.channel}`
      : `used ${panel.channel ?? "—"}, expected Channel ${expected.channel}`,
  });

  // --- Transmit power ------------------------------------------------------
  const powerCorrect = panel.power === expected.power;
  fields.push({
    id: "power",
    label: "Transmit power",
    correct: powerCorrect,
    detail: powerCorrect
      ? POWER_LABELS[expected.power]
      : `set ${POWER_LABELS[panel.power]}, expected ${POWER_LABELS[expected.power]}`,
  });

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
 * the assessed judgment; any DSC activation is wrong. The equipment/channel
 * fields on the block are ignored here — only the no-DSC fact is graded.
 *
 * `criticalFailure` stays false in this slice; capping a false distress alert at
 * fail is handled by the critical-failure slice (#98).
 */
function gradeForbidden(panel: DscPanelState): ProcedureGrade {
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
  ];
  return {
    fields,
    correct: sentDsc ? 0 : 1,
    total: 1,
    status: sentDsc ? "fail" : "pass",
    criticalFailure: false,
  };
}

/**
 * Permitted state: an on-scene MAYDAY relay (you are at the scene of the
 * casualty) MAY send a DSC distress alert with nature Undesignated. Scored
 * neutrally — sending that, or sending nothing, both contribute zero to the
 * score; only a *wrong* DSC config is penalised. The leniency is gated by the
 * explicit `onScene` flag, never inferred: without it, only voice-only is
 * acceptable (i.e. it behaves like `forbidden`).
 */
function gradePermitted(expected: ScenarioDsc, panel: DscPanelState): ProcedureGrade {
  const onSceneRelayAllowed = expected.onScene === true;
  const sentPermittedAlert =
    panel.dscActivated && panel.callType === "distress" && panel.nature === "undesignated";
  const acceptable = !panel.dscActivated || (onSceneRelayAllowed && sentPermittedAlert);

  if (acceptable) {
    // Neutral: a passing field is shown for feedback, but total 0 keeps it out
    // of the unified score (gradeScenario only folds dimensions with total > 0).
    const detail = !panel.dscActivated
      ? "voice relay — no DSC alert needed (acceptable)"
      : "on-scene relay — Undesignated distress alert (acceptable)";
    return {
      fields: [{ id: "dsc", label: "DSC alert", correct: true, detail }],
      correct: 0,
      total: 0,
      status: "pass",
      criticalFailure: false,
    };
  }

  return {
    fields: [
      {
        id: "dsc",
        label: "DSC alert",
        correct: false,
        detail: onSceneRelayAllowed
          ? "if you relay by DSC on-scene, send a Distress alert with nature Undesignated"
          : "no DSC alert was required here — relay by voice",
      },
    ],
    correct: 0,
    total: 1,
    status: "fail",
    criticalFailure: false,
  };
}
