import { natureOfDistressLabels, type NatureOfDistress } from "@gmdss-simulator/utils";
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
 * Implements the `required` state for the Distress family (nature) and the
 * All Ships / Individual families (precedence). The `forbidden` and `permitted`
 * states (voice-only / on-scene relay) are added by a later slice; until then
 * every `dsc` block in content is `required`.
 */
export function gradeProcedure(expected: ScenarioDsc, panel: DscPanelState): ProcedureGrade {
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
