import type { RubricDefinition, ScenarioDefinition } from "@gmdss-simulator/utils";
import { materializeSituational } from "./materialize.ts";
import type { ScriptDrillContent } from "./types.ts";

const STRUCTURAL_RUBRIC_ID = "v1/distress";

const V1_SCENARIO_PATHS: ReadonlyArray<{ tier: string; file: string }> = [
  { tier: "tier-2", file: "2.1-mayday-fire" },
  { tier: "tier-4", file: "4.1-exam-distress" },
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loadRubric(rubricId: string): Promise<RubricDefinition> {
  return fetchJson<RubricDefinition>(`/content/en/rubrics/${rubricId}.json`);
}

export async function loadScenario(tier: string, file: string): Promise<ScenarioDefinition> {
  return fetchJson<ScenarioDefinition>(`/content/en/scenarios/${tier}/${file}.json`);
}

export async function loadScriptDrillContent(): Promise<ScriptDrillContent> {
  const structuralRubric = await loadRubric(STRUCTURAL_RUBRIC_ID);

  const scenarios: ScenarioDefinition[] = await Promise.all(
    V1_SCENARIO_PATHS.map(({ tier, file }) => loadScenario(tier, file)),
  );

  const uniqueRubricIds = Array.from(new Set(scenarios.map((s) => s.rubricId)));
  const rubrics = await Promise.all(uniqueRubricIds.map((id) => loadRubric(id)));
  const rubricsByScenario = new Map<string, RubricDefinition>();
  for (const scenario of scenarios) {
    const rubric = rubrics.find((r) => r.id === scenario.rubricId);
    if (!rubric) {
      throw new Error(`Rubric ${scenario.rubricId} not found for scenario ${scenario.id}`);
    }
    rubricsByScenario.set(scenario.id, rubric);
  }

  return {
    structuralRubric,
    scenarios: scenarios.map(materializeSituational),
    rubricsByScenario,
  };
}
