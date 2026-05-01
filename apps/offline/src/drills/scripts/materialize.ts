import type { RubricDefinition } from "@gmdss-simulator/utils";
import {
  PRIORITY_IDS,
  type PriorityId,
  type RubricsByPriority,
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
};

const FALLBACK_LABELS: Readonly<Record<string, string>> = {
  vessel: "Vessel name",
  callsign: "Callsign / MMSI",
  position: "Position",
  nature: "Nature of message",
  assistance: "Assistance / information needed",
  persons: "Persons on board",
  over: "OVER",
  out: "OUT",
};

type FactKey = keyof ScenarioFacts;

const FACT_GETTERS: Readonly<Record<FactKey, (f: ScenarioFacts) => string | undefined>> = {
  vessel: (f) => f.vessel,
  callsign: (f) => f.callsign,
  position: (f) => f.position,
  nature: (f) => f.nature,
  assistance: (f) => f.assistance,
  persons: (f) => f.persons,
};

function factLabel(itemId: string, facts: ScenarioFacts, fallback: string): string {
  const getter = FACT_GETTERS[itemId as FactKey];
  return getter ? (getter(facts) ?? fallback) : fallback;
}

function injectScenarioLabels(
  items: readonly { id: string; label: string }[],
  facts: ScenarioFacts,
): SequenceItem[] {
  return items.map((item) => ({
    id: item.id,
    label: factLabel(item.id, facts, item.label),
  }));
}

function decoyOpening(priority: PriorityId): readonly SequenceItem[] {
  const label = PRIORITY_LABELS[priority];
  return [
    { id: priority, label },
    { id: priority, label },
    { id: priority, label },
  ];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function materializeScenario(
  scenario: Scenario,
  rubricsByPriority: RubricsByPriority,
): SequenceTemplate {
  const rubric = rubricsByPriority[scenario.priority];
  if (!rubric) {
    throw new Error(`No rubric available for priority ${scenario.priority}`);
  }
  if (!rubric.sequenceParts || rubric.sequenceParts.length === 0) {
    throw new Error(`Rubric ${rubric.id} has no sequenceParts`);
  }

  const parts: SequenceTemplatePart[] = rubric.sequenceParts.map((part) => ({
    id: part.id,
    label: part.label,
    items: injectScenarioLabels(part.items, scenario.facts),
  }));

  const correctItems = parts.flatMap((p) => p.items);
  const decoys = PRIORITY_IDS.filter((p) => p !== scenario.priority).flatMap((p) =>
    decoyOpening(p),
  );
  const pool = shuffle([...correctItems, ...decoys]);

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
