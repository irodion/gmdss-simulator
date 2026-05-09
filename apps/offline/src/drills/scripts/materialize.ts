import type { RubricDefinition } from "@gmdss-simulator/utils";
import { shuffle } from "../drill-types.ts";
import {
  DSC_NATURE_PLACEHOLDER_ID,
  NATURE_CODES,
  NATURE_LABELS,
  type NatureCode,
  PRIORITY_IDS,
  type PriorityId,
  type RubricsById,
  type Scenario,
  type ScenarioFacts,
  type SequenceItem,
  type SequenceTemplate,
  type SequenceTemplatePart,
} from "./types.ts";

const NATURE_DECOY_COUNT = 4;
const IN_RAFT_ITEM: SequenceItem = {
  id: "in_raft",
  label: "In raft: EPIRB, SART, portable VHF",
};

const PRIORITY_LABELS: Readonly<Record<PriorityId, string>> = {
  mayday: "MAYDAY",
  pan_pan: "PAN-PAN",
  securite: "SECURITE",
};

const FALLBACK_LABELS: Readonly<Record<string, string>> = {
  vessel: "Vessel name",
  callsign: "Callsign / MMSI",
  position: "Position",
  nature: "Nature of message",
  assistance: "Assistance / information needed",
  persons: "Persons on board",
  sart_addressee: "Ship who received my Radar SART",
  ship_description: "Ship description",
  addressee_rcc: "RCC station name",
  action_request: "Action request",
  addressee: "Addressee (All Stations / RCC)",
  patient_vitals: "Patient vitals (gender, age, temp, BP)",
  patient_status: "Patient status / problem",
  actions_taken: "Actions taken / treatment given",
  over: "OVER",
  out: "OUT",
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
} as const satisfies Readonly<Record<string, keyof ScenarioFacts>>;

type StringFactKey = (typeof ITEM_TO_FACT_KEY)[keyof typeof ITEM_TO_FACT_KEY];

function factLabel(itemId: string, facts: ScenarioFacts, fallback: string): string {
  const factKey = (ITEM_TO_FACT_KEY as Readonly<Record<string, StringFactKey>>)[itemId];
  if (!factKey) return fallback;
  return facts[factKey] ?? fallback;
}

function buildAcceptableNatureSet(facts: ScenarioFacts): readonly NatureCode[] {
  if (!facts.natureCode) return [];
  const extras = facts.acceptableNatureCodes ?? [];
  const seen = new Set<NatureCode>([facts.natureCode, ...extras]);
  return Array.from(seen);
}

function injectScenarioLabels(
  items: readonly { id: string; label: string }[],
  facts: ScenarioFacts,
  scenarioId: string,
  acceptableNatureIds: readonly NatureCode[],
): SequenceItem[] {
  return items.map((item) => {
    if (item.id === DSC_NATURE_PLACEHOLDER_ID) {
      const code = facts.natureCode;
      if (!code) {
        throw new Error(`Scenario ${scenarioId} uses dsc_nature slot but has no facts.natureCode`);
      }
      const otherAcceptable = acceptableNatureIds.filter((c) => c !== code);
      return {
        id: code,
        label: NATURE_LABELS[code],
        ...(otherAcceptable.length > 0 ? { acceptableIds: otherAcceptable } : {}),
      };
    }
    return {
      id: item.id,
      label: factLabel(item.id, facts, item.label),
    };
  });
}

function decoyOpening(priority: PriorityId): readonly SequenceItem[] {
  const label = PRIORITY_LABELS[priority];
  return [
    { id: priority, label },
    { id: priority, label },
    { id: priority, label },
  ];
}

function pickNatureDecoys(
  acceptable: readonly NatureCode[],
  count: number,
): readonly SequenceItem[] {
  const exclude = new Set<NatureCode>(acceptable);
  const candidates = NATURE_CODES.filter((code) => !exclude.has(code));
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count).map((code) => ({ id: code, label: NATURE_LABELS[code] }));
}

function natureChip(code: NatureCode): SequenceItem {
  return { id: code, label: NATURE_LABELS[code] };
}

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

  const hasNatureSlot = rubric.sequenceParts.some((part) =>
    part.items.some((item) => item.id === DSC_NATURE_PLACEHOLDER_ID),
  );
  const acceptableNatureIds = hasNatureSlot ? buildAcceptableNatureSet(scenario.facts) : [];

  const parts: SequenceTemplatePart[] = rubric.sequenceParts.map((part, partIndex) => {
    const items = injectScenarioLabels(
      part.items,
      scenario.facts,
      scenario.id,
      acceptableNatureIds,
    );
    const isLast = partIndex === (rubric.sequenceParts?.length ?? 0) - 1;
    if (isLast && scenario.requiresAbandon) {
      return { id: part.id, label: part.label, items: [...items, IN_RAFT_ITEM] };
    }
    return { id: part.id, label: part.label, items };
  });

  const correctItems = parts.flatMap((p) => p.items);
  const priorityDecoys = PRIORITY_IDS.filter((p) => p !== scenario.priority).flatMap((p) =>
    decoyOpening(p),
  );
  // Pool gets every acceptable nature chip (canonical is already in correctItems via the
  // dsc_nature slot; the rest are added here so the student can actually pick them) plus
  // NATURE_DECOY_COUNT random distractors drawn from natures NOT in the acceptable set.
  const extraAcceptableChips = acceptableNatureIds
    .filter((code) => code !== scenario.facts.natureCode)
    .map(natureChip);
  const natureDecoys =
    acceptableNatureIds.length > 0 ? pickNatureDecoys(acceptableNatureIds, NATURE_DECOY_COUNT) : [];
  const pool = shuffle([
    ...correctItems,
    ...priorityDecoys,
    ...extraAcceptableChips,
    ...natureDecoys,
  ]);

  const heading = parts[0]?.label ?? rubric.id;
  return {
    rubricId: rubric.id,
    callLabel: heading,
    priorityId: scenario.priority,
    parts,
    pool,
  };
}

/**
 * Legacy structural materializer kept for tests / migration.
 * Builds a generic (non-scenario) template with placeholder labels and a pool
 * limited to the part's own items (no priority decoys).
 */
export function materializeStructural(rubric: RubricDefinition): SequenceTemplate {
  if (!rubric.sequenceParts || rubric.sequenceParts.length === 0) {
    throw new Error(`Rubric ${rubric.id} has no sequenceParts`);
  }
  const parts: SequenceTemplatePart[] = rubric.sequenceParts.map((part) => ({
    id: part.id,
    label: part.label,
    items: part.items.map((item) => ({
      id: item.id,
      label: item.label || (FALLBACK_LABELS[item.id] ?? item.id),
    })),
  }));
  const heading = parts[0]?.label ?? rubric.id;
  const priorityId = inferPriorityFromCategory(rubric.category);
  const pool = shuffle(parts.flatMap((p) => p.items));
  return {
    rubricId: rubric.id,
    callLabel: heading,
    priorityId,
    parts,
    pool,
  };
}

function inferPriorityFromCategory(category: RubricDefinition["category"]): PriorityId {
  switch (category) {
    case "urgency":
      return "pan_pan";
    case "safety":
      return "securite";
    default:
      return "mayday";
  }
}
