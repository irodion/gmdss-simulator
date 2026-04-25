import type { NatureOfDistress } from "./dsc-types.ts";
import type { ScenarioCategory } from "./scenario-types.ts";

export type ScoringDimensionId = "required_fields" | "prowords" | "sequence" | "channel" | "dsc";

export interface ScoringDimension {
  readonly id: ScoringDimensionId;
  readonly label: string;
  readonly weight: number;
  readonly score: number;
  readonly maxScore: 100;
  readonly matchedItems: readonly string[];
  readonly missingItems: readonly string[];
}

export interface ScoreBreakdown {
  readonly overall: number;
  readonly dimensions: readonly ScoringDimension[];
  readonly rubricVersion: string;
  readonly timestamp: number;
}

export interface FieldRule {
  readonly id: string;
  readonly label: string;
  readonly patterns: readonly string[];
  readonly required: boolean;
}

export interface ProwordRule {
  readonly id: string;
  readonly label: string;
  readonly pattern: string;
  readonly expectedCount?: number;
}

export interface SequenceRules {
  readonly fieldOrder: readonly string[];
}

export interface ChannelRules {
  readonly requiredChannel: number;
  readonly blockChannel70Voice: boolean;
}

export interface DscRules {
  readonly required: boolean;
  readonly beforeFirstVoiceTurn: boolean;
  readonly expectedNature?: NatureOfDistress;
}

export interface RubricDefinition {
  readonly id: string;
  readonly version: string;
  readonly category: ScenarioCategory;
  readonly requiredFields: readonly FieldRule[];
  readonly prowordRules: readonly ProwordRule[];
  readonly sequenceRules: SequenceRules;
  readonly channelRules: ChannelRules;
  /** When present, scoring includes a DSC dimension and uses alternate weights. */
  readonly dscRules?: DscRules;
}
