import type { RubricDefinition } from "@gmdss-simulator/utils";
import type { PriorityId, RubricsByPriority, ScenarioBank, ScriptDrillContent } from "./types.ts";

const RUBRIC_IDS: Readonly<Record<PriorityId, string>> = {
  mayday: "v1/distress",
  pan_pan: "v1/urgency",
  securite: "v1/safety",
};

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
  const [mayday, pan_pan, securite, scenarios] = await Promise.all([
    loadRubric(RUBRIC_IDS.mayday),
    loadRubric(RUBRIC_IDS.pan_pan),
    loadRubric(RUBRIC_IDS.securite),
    fetchJson<ScenarioBank>(SCENARIOS_URL),
  ]);
  const rubrics: RubricsByPriority = { mayday, pan_pan, securite };
  return { rubrics, scenarios };
}
