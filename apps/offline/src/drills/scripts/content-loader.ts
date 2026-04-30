import type { RubricDefinition } from "@gmdss-simulator/utils";
import type { ScriptDrillContent } from "./types.ts";

const STRUCTURAL_RUBRIC_ID = "v1/distress";

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
  const structuralRubric = await loadRubric(STRUCTURAL_RUBRIC_ID);
  return { structuralRubric };
}
