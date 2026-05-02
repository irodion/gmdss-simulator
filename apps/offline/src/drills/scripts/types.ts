import type { RubricDefinition } from "@gmdss-simulator/utils";

export type ScriptDrillMode = "scenario";

export type PriorityId = "mayday" | "pan_pan" | "securite";

export const PRIORITY_IDS: readonly PriorityId[] = ["mayday", "pan_pan", "securite"];

export function isPriorityItem(id: string): id is PriorityId {
  return (PRIORITY_IDS as readonly string[]).includes(id);
}

export type NatureCode =
  | "nature_undesignated"
  | "nature_collision"
  | "nature_fire"
  | "nature_disabled"
  | "nature_listing"
  | "nature_flooding"
  | "nature_grounding"
  | "nature_piracy"
  | "nature_abandoning"
  | "nature_mob";

export const NATURE_CODES: readonly NatureCode[] = [
  "nature_undesignated",
  "nature_collision",
  "nature_fire",
  "nature_disabled",
  "nature_listing",
  "nature_flooding",
  "nature_grounding",
  "nature_piracy",
  "nature_abandoning",
  "nature_mob",
];

export const NATURE_LABELS: Readonly<Record<NatureCode, string>> = {
  nature_undesignated: "DSC: Undesignated",
  nature_collision: "DSC: Collision",
  nature_fire: "DSC: Fire & Explosion",
  nature_disabled: "DSC: Disabled & Adrift",
  nature_listing: "DSC: Listing & Capsizing",
  nature_flooding: "DSC: Flooding",
  nature_grounding: "DSC: Grounding",
  nature_piracy: "DSC: Piracy",
  nature_abandoning: "DSC: Abandoning",
  nature_mob: "DSC: Man overboard",
};

export function isNatureItem(id: string): id is NatureCode {
  return (NATURE_CODES as readonly string[]).includes(id);
}

export const DSC_NATURE_PLACEHOLDER_ID = "dsc_nature";

const PROCEDURE_STEP_IDS = [
  "epirb_on",
  "dsc_channel70",
  "dsc_time_location",
  DSC_NATURE_PLACEHOLDER_ID,
  "dsc_button",
  "dsc_channel16",
  "in_raft",
  "dsc_urgency_category",
  "dsc_addressee_all_stations",
  "dsc_time_position",
  "dsc_send_urgency",
] as const;

export function isProcedureItem(id: string): boolean {
  return (PROCEDURE_STEP_IDS as readonly string[]).includes(id) || isNatureItem(id);
}

export interface SequenceItem {
  readonly id: string;
  readonly label: string;
  /**
   * Alternate item ids that should also be accepted as correct in this slot.
   * The slot's own `id` is implicitly always accepted; `acceptableIds` adds
   * other defensible answers (e.g. multiple DSC nature codes that map to the
   * same scenario). Empty/undefined ⇒ strict id equality.
   */
  readonly acceptableIds?: readonly string[];
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

export type DimensionId = "priority" | "vessel" | "body" | "ending" | "procedure";
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
  readonly position?: string;
  readonly nature?: string;
  readonly assistance?: string;
  readonly persons?: string;
  readonly sartAddressee?: string;
  readonly shipDescription?: string;
  readonly addresseeRcc?: string;
  readonly actionRequest?: string;
  readonly natureCode?: NatureCode;
  /**
   * Additional DSC nature codes that should also be accepted for this scenario.
   * The canonical `natureCode` is always accepted; `acceptableNatureCodes` lists
   * other defensible picks. Pool decoys exclude every acceptable code.
   */
  readonly acceptableNatureCodes?: readonly NatureCode[];
  /**
   * Voice-call addressee (e.g. "All Stations", "RCC Haifa"). Used by the
   * MEDICO drill to populate the addressee chips in both the initial Ch 16
   * call and the working-channel re-establishment header.
   */
  readonly addressee?: string;
  /** Patient vitals line for the MEDICO detailed-message phase. */
  readonly patientVitals?: string;
  /** Short patient status / problem description. */
  readonly patientStatus?: string;
  /** Actions taken by the crew, treatment given, medication administered. */
  readonly actionsTaken?: string;
}

export interface Scenario {
  readonly id: string;
  readonly priority: PriorityId;
  readonly rubricId: string;
  readonly brief: string;
  readonly facts: ScenarioFacts;
  readonly requiresAbandon?: boolean;
}

export interface ScenarioBank {
  readonly scenarios: readonly Scenario[];
}

export type RubricsById = Readonly<Record<string, RubricDefinition>>;

export interface ScriptDrillContent {
  readonly rubrics: RubricsById;
  readonly scenarios: ScenarioBank;
}

export const PASS_THRESHOLD = 80;
