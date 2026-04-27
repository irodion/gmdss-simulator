import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import {
  callLabelForCategory,
  type SequenceGrade,
  type SequenceItem,
  type SequencePartGrade,
  type SequencePlacementResult,
  type SequenceTemplate,
  type SequenceTemplatePart,
  type SituationalPrompt,
} from "./types.ts";

export function materializeStructural(rubric: RubricDefinition): SequenceTemplate {
  if (!rubric.sequenceParts || rubric.sequenceParts.length === 0) {
    throw new Error(`Rubric ${rubric.id} has no sequenceParts; sequencing drill requires them`);
  }
  const parts: SequenceTemplatePart[] = rubric.sequenceParts.map((part) => ({
    id: part.id,
    label: part.label,
    items: part.items.map((item) => ({ id: item.id, label: item.label })),
  }));
  return {
    rubricId: rubric.id,
    callLabel: callLabelForCategory(rubric.category),
    parts,
  };
}

export function gradeSequence(
  template: SequenceTemplate,
  placementsByPart: ReadonlyMap<string, readonly SequenceItem[]>,
): SequenceGrade {
  const parts: SequencePartGrade[] = [];
  let correctCount = 0;
  let total = 0;

  for (const part of template.parts) {
    const placements = placementsByPart.get(part.id) ?? [];
    const partResults: SequencePlacementResult[] = [];
    for (let i = 0; i < part.items.length; i++) {
      const expected = part.items[i]!;
      const placed = placements[i]!;
      const correct = placed.id === expected.id;
      if (correct) correctCount++;
      total++;
      partResults.push({ placed, expected, correct });
    }
    parts.push({ partId: part.id, placements: partResults });
  }

  return {
    parts,
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
