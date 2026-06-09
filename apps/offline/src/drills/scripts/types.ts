import type { NatureOfDistress, RubricDefinition } from "@gmdss-simulator/utils";

export type ScriptDrillMode = "scenario";

export type PriorityId = "mayday" | "pan_pan" | "securite" | "routine";

/**
 * The three radiotelephony signal-word priorities. `routine` is a valid
 * scenario priority (e.g. a Transit Report) but carries no spoken signal word,
 * so it is deliberately excluded here: `PRIORITY_IDS` drives the priority-chip
 * pool and the decoy openings, and a routine call must offer none of its own —
 * picking any signal word is the mistake the drill tests for.
 */
export const PRIORITY_IDS: readonly PriorityId[] = ["mayday", "pan_pan", "securite"];

export function isPriorityItem(id: string): id is PriorityId {
  return (PRIORITY_IDS as readonly string[]).includes(id);
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
  /**
   * The expected item this entry aligned with via LCS, or `null` if it didn't
   * align (i.e. the student placed an extra/wrong entry that has no counterpart
   * in the expected sequence).
   */
  readonly expected: SequenceItem | null;
  readonly correct: boolean;
}

export interface SequencePartGrade {
  readonly partId: string;
  readonly placements: readonly SequencePlacementResult[];
  /** Expected items the student didn't include (not aligned in the LCS). */
  readonly missing: readonly SequenceItem[];
}

/** Canonical, ordered dimension list — single source of truth for DimensionId. */
export const KNOWN_DIMENSIONS = ["priority", "vessel", "body", "ending", "procedure"] as const;
export type DimensionId = (typeof KNOWN_DIMENSIONS)[number];
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
  /** Student entries that didn't align with any expected item (LCS extras). */
  readonly extraCount: number;
  /**
   * Score in [0, 1]. correctCount / max(totalExpected, totalStudent), so
   * omissions and extra noise both reduce the score symmetrically.
   */
  readonly score: number;
  readonly passed: boolean;
  readonly dimensions: readonly SequenceScoreDimension[];
  /**
   * Present when the Scenario was graded with the DSC/equipment panel: carries
   * the per-field panel results for feedback. Absent for legacy chip Scenarios.
   */
  readonly procedure?: ProcedureGrade;
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
  /** Routine Transit Report (TR): voyage line — departure/destination and ETA. */
  readonly voyage?: string;
  readonly addresseeRcc?: string;
  readonly actionRequest?: string;
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
  /**
   * Relay-only facts: when this vessel re-broadcasts another vessel's
   * distress (MAYDAY RELAY), these fields carry the quoted original
   * vessel's identification and distress details.
   */
  readonly relayedVessel?: string;
  readonly relayedMmsi?: string;
  readonly relayedPosition?: string;
  readonly relayedNature?: string;
  readonly relayedAssistance?: string;
  readonly relayedPersons?: string;
  /** Distress-ack only: name or MMSI of the vessel being acknowledged. */
  readonly distressVessel?: string;
}

/**
 * Whether — and how — a Scenario expects the trainee to touch the DSC controls.
 * `required`: the configuration must match the expected `dsc` block.
 * `forbidden`: any DSC activation is wrong (voice-only liferaft / ack / relay).
 * `permitted`: an Undesignated distress alert may be sent, scored neutrally
 * (gated by an explicit on-scene flag). Only `required` is exercised in the
 * Distress-family walking skeleton; the other two arrive with later slices.
 */
export type DscState = "required" | "forbidden" | "permitted";

/** The three DSC call types in ROC / Class-D VHF scope (no group/relay/area). */
export type DscCallType = "distress" | "individual" | "all_ships";

/** Precedence selected for an Individual or All Ships call. */
export type CallPriority = "routine" | "safety" | "urgency";

/** Transmit power. `low` (1 W) is the mistake in almost every Scenario. */
export type DscPower = "high" | "low";

/**
 * The expected DSC/equipment configuration for a Scenario, authored in content.
 * Replaces the old per-rubric procedure chips: the panel grades the trainee's
 * final configuration against this block (see ADR 0002).
 */
export interface ScenarioDsc {
  readonly state: DscState;
  /** The expected DSC call type when `state` is `required`. */
  readonly callType?: DscCallType;
  /** Distress only: the canonical nature the alert must carry. */
  readonly nature?: NatureOfDistress;
  /** Other natures also accepted in this Scenario (the canonical one is implicit). */
  readonly acceptableNatures?: readonly NatureOfDistress[];
  /** Individual / All Ships only: the expected precedence. */
  readonly priority?: CallPriority;
  /** Individual only: the expected coast-station addressee, by `COAST_STATIONS` id. */
  readonly addressee?: string;
  /** The expected voice working channel (e.g. 16 for own-ship distress). */
  readonly channel: number;
  /** The expected transmit power. */
  readonly power: DscPower;
  /** Whether the EPIRB should be activated. */
  readonly epirb: boolean;
  /** Whether the spare antenna should be rigged (dismasted vessels). */
  readonly spareAntenna?: boolean;
  /** Whether the trainee should grab EPIRB/SART/portable VHF to the liferaft. */
  readonly abandon?: boolean;
  /** Marks an on-scene relay where a permitted Undesignated alert applies (later). */
  readonly onScene?: boolean;
}

/** The trainee's final DSC/equipment panel state, handed to the grader on Submit. */
export interface DscPanelState {
  readonly epirb: boolean;
  readonly spareAntenna: boolean;
  readonly abandon: boolean;
  readonly power: DscPower;
  readonly channel: number | null;
  /** Whether the trainee pressed Activate to "send" the configured DSC call. */
  readonly dscActivated: boolean;
  readonly callType: DscCallType | null;
  readonly nature: NatureOfDistress | null;
  readonly priority: CallPriority | null;
  readonly addressee: string | null;
}

/** One graded panel fact, surfaced as per-field feedback after Submit. */
export interface ProcedureFieldResult {
  readonly id: string;
  readonly label: string;
  readonly correct: boolean;
  /** Human-readable explanation, e.g. "sent Fire, expected Undesignated". */
  readonly detail: string;
}

/** The result of grading the DSC/equipment panel as a checklist of facts. */
export interface ProcedureGrade {
  readonly fields: readonly ProcedureFieldResult[];
  readonly correct: number;
  readonly total: number;
  readonly status: DimensionStatus;
  /**
   * Whether a critical DSC error occurred (false distress alert, or a
   * wrong/missing required call type). `gradeScenario` caps the overall result
   * at fail when set, regardless of the spoken-message score (ADR 0002).
   */
  readonly criticalFailure: boolean;
  /**
   * When `criticalFailure` is set, a one-line attribution of the auto-fail for
   * the breakdown (e.g. "False distress alert …"); `null` otherwise.
   */
  readonly criticalReason: string | null;
}

export interface Scenario {
  readonly id: string;
  readonly priority: PriorityId;
  readonly rubricId: string;
  readonly brief: string;
  readonly facts: ScenarioFacts;
  /**
   * The expected DSC/equipment configuration. Every Scenario is graded with the
   * always-on DSC/equipment panel against this block (ADR 0002); the spoken
   * message is graded separately from the rubric's voice `sequenceParts`.
   */
  readonly dsc?: ScenarioDsc;
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

/**
 * Stable aggregation key for the all-scenarios bucket.
 * `ProceduresHome` reads aggregates by this key; the procedure stats façade
 * writes/reads with it. Keeping the literal in one place prevents silent
 * mismatches between writer and reader.
 */
export const SCENARIO_STATS_KEY = "v1/scenarios";
