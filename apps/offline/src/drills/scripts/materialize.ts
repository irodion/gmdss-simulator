import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import {
  callLabelForCategory,
  type SequenceGrade,
  type SequenceItem,
  type SequencePlacementResult,
  type SequenceTemplate,
  type SituationalPrompt,
} from "./types.ts";

function labelForFieldId(rubric: RubricDefinition, id: string): string | null {
  const field = rubric.requiredFields.find((f) => f.id === id);
  if (field) return field.label;
  const proword = rubric.prowordRules.find((p) => p.id === id);
  return proword ? proword.label : null;
}

export function materializeStructural(rubric: RubricDefinition): SequenceTemplate {
  const correctOrder: SequenceItem[] = rubric.sequenceRules.fieldOrder
    .map((id) => ({ id, label: labelForFieldId(rubric, id) }))
    .filter((entry): entry is SequenceItem => entry.label != null);
  return {
    rubricId: rubric.id,
    callLabel: callLabelForCategory(rubric.category),
    correctOrder,
  };
}

export function gradeSequence(
  template: SequenceTemplate,
  placements: readonly SequenceItem[],
): SequenceGrade {
  const total = template.correctOrder.length;
  const results: SequencePlacementResult[] = [];
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    const expected = template.correctOrder[i]!;
    const placed = placements[i]!;
    const correct = placed.id === expected.id;
    if (correct) correctCount++;
    results.push({ placed, expected, correct });
  }
  return {
    placements: results,
    correctCount,
    total,
    passed: correctCount === total,
  };
}

function renderTemplate(template: string, vessel: ScenarioDefinition["vessel"]): string {
  const personsOnBoard =
    vessel.personsOnBoard != null ? String(vessel.personsOnBoard) : "(personsOnBoard)";
  const vars: Record<string, string> = {
    vesselName: vessel.name,
    callsign: vessel.callsign ?? "(callsign)",
    mmsi: vessel.mmsi ?? "(mmsi)",
    position: vessel.position ?? "(position)",
    personsOnBoard,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

export function materializeSituational(scenario: ScenarioDefinition): SituationalPrompt {
  const canonical = scenario.scriptReference
    ? renderTemplate(scenario.scriptReference, scenario.vessel)
    : "";
  return {
    scenarioId: scenario.id,
    rubricId: scenario.rubricId,
    title: scenario.title,
    description: scenario.description,
    task: scenario.task,
    vessel: scenario.vessel,
    hints: scenario.hints ?? [],
    canonical,
    requiredChannel: scenario.requiredChannel,
    category: scenario.category,
  };
}
