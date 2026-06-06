import type { RubricDefinition } from "@gmdss-simulator/utils";
import { fetchContentJson } from "../../lib/fetch-content.ts";
import type { RubricsById, ScenarioBank, ScriptDrillContent } from "./types.ts";

const SCENARIOS_URL = "/content/en/rubrics/v1/scenarios.json";

export async function loadRubric(rubricId: string): Promise<RubricDefinition> {
  return fetchContentJson<RubricDefinition>(`/content/en/rubrics/${rubricId}.json`);
}

export async function loadScriptDrillContent(): Promise<ScriptDrillContent> {
  const scenarios = await fetchContentJson<ScenarioBank>(SCENARIOS_URL);
  const rubricIds = Array.from(new Set(scenarios.scenarios.map((s) => s.rubricId)));
  const loaded = await Promise.all(rubricIds.map((id) => loadRubric(id)));
  const rubrics: RubricsById = Object.fromEntries(loaded.map((r) => [r.id, r]));
  return { rubrics, scenarios };
}
