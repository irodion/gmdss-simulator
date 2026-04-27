import type {
  RubricDefinition,
  ScenarioCategory,
  ScenarioVessel,
  ScoreBreakdown,
} from "@gmdss-simulator/utils";

export type ScriptDrillMode = "structural" | "situational";

export type StructuralKind = "next-after";

export interface MCQuestion {
  readonly id: string;
  readonly kind: StructuralKind;
  readonly rubricId: string;
  readonly callLabel: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
}

export interface SituationalPrompt {
  readonly scenarioId: string;
  readonly rubricId: string;
  readonly title: string;
  readonly description: string;
  readonly task: string;
  readonly vessel: ScenarioVessel;
  readonly hints: readonly string[];
  readonly canonical: string;
  readonly requiredChannel: number;
  readonly category: ScenarioCategory;
}

export interface SituationalGrade {
  readonly breakdown: ScoreBreakdown;
  readonly passed: boolean;
}

export interface GradeEvent {
  readonly rubricId: string;
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly ts: number;
  readonly correct: boolean;
}

export interface ScriptDrillContent {
  readonly structuralRubric: RubricDefinition;
  readonly scenarios: readonly SituationalPrompt[];
  readonly rubricsByScenario: ReadonlyMap<string, RubricDefinition>;
}

export const PASS_THRESHOLD = 80;

const CATEGORY_CALL_LABEL: Readonly<Record<ScenarioCategory, string>> = {
  distress: "MAYDAY call",
  urgency: "PAN-PAN call",
  safety: "SECURITE call",
  routine: "routine call",
};

export function callLabelForCategory(category: ScenarioCategory): string {
  return CATEGORY_CALL_LABEL[category];
}
