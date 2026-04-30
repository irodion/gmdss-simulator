import type { RubricDefinition } from "@gmdss-simulator/utils";

export type ScriptDrillMode = "structural";

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

export interface GradeEvent {
  readonly rubricId: string;
  readonly mode: ScriptDrillMode;
  readonly key: string;
  readonly ts: number;
  readonly correct: boolean;
}

export interface ScriptDrillContent {
  readonly structuralRubric: RubricDefinition;
}

export const PASS_THRESHOLD = 80;
