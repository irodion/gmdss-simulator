import type { RubricDefinition } from "@gmdss-simulator/utils";

export type ScriptDrillMode = "scenario";

export type PriorityId = "mayday" | "pan_pan" | "securite";

export const PRIORITY_IDS: readonly PriorityId[] = ["mayday", "pan_pan", "securite"];

export function isPriorityItem(id: string): id is PriorityId {
  return (PRIORITY_IDS as readonly string[]).includes(id);
}

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
  readonly priorityId: PriorityId;
  readonly parts: readonly SequenceTemplatePart[];
  readonly pool: readonly SequenceItem[];
}

export interface SequencePlacementResult {
  readonly placed: SequenceItem;
  readonly expected: SequenceItem;
  readonly correct: boolean;
}

export interface SequencePartGrade {
  readonly partId: string;
  readonly placements: readonly SequencePlacementResult[];
}

export type DimensionId = "priority" | "vessel" | "body" | "ending";
export type DimensionStatus = "pass" | "partial" | "fail";

export interface SequenceScoreDimension {
  readonly id: DimensionId;
  readonly label: string;
  readonly correct: number;
  readonly total: number;
  readonly status: DimensionStatus;
}

export interface SequenceGrade {
  readonly parts: readonly SequencePartGrade[];
  readonly correctCount: number;
  readonly total: number;
  readonly passed: boolean;
  readonly dimensions: readonly SequenceScoreDimension[];
}

export interface GradeEvent {
  readonly rubricId: string;
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly ts: number;
  readonly correct: boolean;
  readonly scenarioId?: string;
  readonly dimensionPasses?: Readonly<Record<DimensionId, boolean>>;
}

export interface ScenarioFacts {
  readonly vessel: string;
  readonly callsign?: string;
  readonly position: string;
  readonly nature: string;
  readonly assistance?: string;
  readonly persons?: string;
}

export interface Scenario {
  readonly id: string;
  readonly priority: PriorityId;
  readonly rubricId: string;
  readonly brief: string;
  readonly facts: ScenarioFacts;
}

export interface ScenarioBank {
  readonly scenarios: readonly Scenario[];
}

export type RubricsByPriority = Readonly<Record<PriorityId, RubricDefinition>>;

export interface ScriptDrillContent {
  readonly rubrics: RubricsByPriority;
  readonly scenarios: ScenarioBank;
}

export const PASS_THRESHOLD = 80;
