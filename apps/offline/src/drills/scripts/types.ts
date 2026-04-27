import type {
  RubricDefinition,
  ScenarioCategory,
  ScenarioVessel,
  ScoreBreakdown,
} from "@gmdss-simulator/utils";

export type ScriptDrillMode = "structural" | "situational";

export interface SequenceItem {
  readonly id: string;
  readonly label: string;
}

export interface SequenceTemplatePart {
  readonly id: string;
  readonly label: string;
  readonly items: readonly SequenceItem[];
}

export interface SequenceTemplate {
  readonly rubricId: string;
  readonly callLabel: string;
  readonly parts: readonly SequenceTemplatePart[];
}

export interface SequencePlacementResult {
  readonly placed: SequenceItem;
  readonly expected: SequenceItem;
  readonly correct: boolean;
}

/** One graded result per part, plus an aggregate. */
export interface SequencePartGrade {
  readonly partId: string;
  readonly placements: readonly SequencePlacementResult[];
}

export interface SequenceGrade {
  readonly parts: readonly SequencePartGrade[];
  readonly correctCount: number;
  readonly total: number;
  readonly passed: boolean;
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
