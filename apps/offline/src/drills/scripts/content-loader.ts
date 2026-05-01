import type { RubricDefinition } from "@gmdss-simulator/utils";
import type { RubricsById, ScenarioBank, ScriptDrillContent } from "./types.ts";

const SCENARIOS_URL = "/content/en/rubrics/v1/scenarios.json";

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

export async function loadScriptDrillContent(): Promise<ScriptDrillContent> {
  const scenarios = await fetchJson<ScenarioBank>(SCENARIOS_URL);
  const rubricIds = Array.from(new Set(scenarios.scenarios.map((s) => s.rubricId)));
  const loaded = await Promise.all(rubricIds.map((id) => loadRubric(id)));
  const rubrics: RubricsById = Object.fromEntries(loaded.map((r) => [r.id, r]));
  return { rubrics, scenarios };
}
