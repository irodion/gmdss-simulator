import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import { generateNextAfterQuestions } from "./checkpoint-gen.ts";
import type { MCQuestion, SituationalPrompt } from "./types.ts";

export function materializeStructural(rubric: RubricDefinition): MCQuestion[] {
  return generateNextAfterQuestions(rubric);
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
