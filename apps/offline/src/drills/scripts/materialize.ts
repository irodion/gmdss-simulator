import { shuffle } from "../drill-types.ts";
import {
  PRIORITY_IDS,
  type PriorityId,
  type RubricsById,
  type Scenario,
  type ScenarioFacts,
  type SequenceItem,
  type SequenceTemplate,
  type SequenceTemplatePart,
} from "./types.ts";

const PRIORITY_LABELS: Readonly<Record<PriorityId, string>> = {
  mayday: "MAYDAY",
  pan_pan: "PAN-PAN",
  securite: "SECURITE",
  // Routine carries no signal word; the label is only used by the daily tile.
  routine: "ROUTINE",
};

const ITEM_TO_FACT_KEY = {
  vessel: "vessel",
  callsign: "callsign",
  position: "position",
  nature: "nature",
  assistance: "assistance",
  persons: "persons",
  sart_addressee: "sartAddressee",
  ship_description: "shipDescription",
  addressee_rcc: "addresseeRcc",
  action_request: "actionRequest",
  addressee: "addressee",
  patient_vitals: "patientVitals",
  patient_status: "patientStatus",
  actions_taken: "actionsTaken",
  relayed_vessel: "relayedVessel",
  relayed_mmsi: "relayedMmsi",
  relayed_position: "relayedPosition",
  relayed_nature: "relayedNature",
  relayed_assistance: "relayedAssistance",
  relayed_persons: "relayedPersons",
  distress_vessel: "distressVessel",
  tr_voyage: "voyage",
} as const satisfies Readonly<Record<string, keyof ScenarioFacts>>;

function factLabel(itemId: string, facts: ScenarioFacts, fallback: string): string {
  const factKey = (ITEM_TO_FACT_KEY as Record<string, keyof ScenarioFacts>)[itemId];
  if (!factKey) return fallback;
  return facts[factKey] ?? fallback;
}

function injectScenarioLabels(
  items: readonly { id: string; label: string }[],
  facts: ScenarioFacts,
): SequenceItem[] {
  return items.map((item) => ({ id: item.id, label: factLabel(item.id, facts, item.label) }));
}

function decoyOpening(priority: PriorityId): readonly SequenceItem[] {
  const label = PRIORITY_LABELS[priority];
  return [
    { id: priority, label },
    { id: priority, label },
    { id: priority, label },
  ];
}

/**
 * Build the spoken-message template for a Scenario. The DSC/equipment phase is
 * graded entirely through the always-on panel (see ADR 0002), so a rubric's
 * `sequenceParts` now carry only the spoken-radio chips; this materializer
 * fills in the scenario-specific labels and adds the wrong-priority decoy
 * openings. The fixed channel/power/nature option lists live in the panel, so
 * there are no longer any nature, channel-power, or callsign decoy pools.
 */
export function materializeScenario(
  scenario: Scenario,
  rubricsById: RubricsById,
): SequenceTemplate {
  const rubric = rubricsById[scenario.rubricId];
  if (!rubric) {
    throw new Error(`No rubric available for id ${scenario.rubricId}`);
  }
  if (!rubric.sequenceParts || rubric.sequenceParts.length === 0) {
    throw new Error(`Rubric ${rubric.id} has no sequenceParts`);
  }

  const parts: SequenceTemplatePart[] = rubric.sequenceParts
    .map((part) => ({
      id: part.id,
      label: part.label,
      items: injectScenarioLabels(part.items, scenario.facts),
    }))
    .filter((part) => part.items.length > 0);

  const correctItems = parts.flatMap((p) => p.items);
  const priorityDecoys = PRIORITY_IDS.filter((p) => p !== scenario.priority).flatMap((p) =>
    decoyOpening(p),
  );
  const pool = shuffle([...correctItems, ...priorityDecoys]);
  const heading = parts[0]?.label ?? rubric.id;

  return {
    rubricId: rubric.id,
    callLabel: heading,
    priorityId: scenario.priority,
    parts,
    pool,
  };
}
