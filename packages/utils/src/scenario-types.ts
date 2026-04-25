import type { DscRules } from "./rubric-types.ts";

export type ScenarioTier = 1 | 2 | 3 | 4;

export type ScenarioCategory = "routine" | "safety" | "urgency" | "distress";

export type SessionPhase = "loading" | "briefing" | "active" | "debriefing";

export type TurnSpeaker = "student" | "station";

export interface ScenarioVessel {
  readonly name: string;
  readonly callsign?: string;
  readonly mmsi?: string;
  readonly position?: string;
  readonly personsOnBoard?: number;
}

export type ResponseCondition =
  | { readonly type: "channel_is"; readonly channel: number }
  | { readonly type: "transcript_contains"; readonly pattern: string }
  | { readonly type: "always" };

export interface ScriptedResponse {
  readonly id: string;
  readonly speaker: string;
  readonly text: string;
  readonly triggerAfterTurnIndex: number;
  readonly condition?: ResponseCondition;
}

export interface ScenarioDefinition {
  readonly id: string;
  readonly tier: ScenarioTier;
  readonly category: ScenarioCategory;
  readonly title: string;
  readonly description: string;
  readonly stationPersona: string;
  readonly stationName?: string;
  readonly vessel: ScenarioVessel;
  readonly requiredChannel: number;
  readonly allowedChannels?: readonly number[];
  readonly initialGpsLock?: boolean;
  readonly task: string;
  /** Per-scenario LLM instructions for the station persona. */
  readonly stationPrompt?: string;
  readonly scriptReference?: string;
  readonly scriptedResponses: readonly ScriptedResponse[];
  readonly rubricId: string;
  readonly closingRubricId?: string;
  readonly closingScriptReference?: string;
  readonly hints?: readonly string[];
  /** When set, requires a DSC distress alert to have been sent (graded). */
  readonly dscRequirement?: DscRules;
}

export interface Turn {
  readonly index: number;
  readonly speaker: TurnSpeaker;
  readonly text: string;
  readonly timestamp: number;
  readonly channel: number;
  readonly durationMs: number;
}

export interface SessionState {
  readonly phase: SessionPhase;
  readonly scenario: ScenarioDefinition | null;
  readonly turns: readonly Turn[];
  readonly currentTurnIndex: number;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
}

export type SessionCommand =
  | { readonly type: "LOAD_SCENARIO"; readonly scenario: ScenarioDefinition }
  | { readonly type: "START_SCENARIO" }
  | {
      readonly type: "ADD_STUDENT_TURN";
      readonly text: string;
      readonly channel: number;
      readonly durationMs: number;
    }
  | {
      readonly type: "ADD_STATION_TURN";
      readonly text: string;
      readonly channel: number;
    }
  | {
      readonly type: "UPDATE_TURN_TEXT";
      readonly turnIndex: number;
      readonly text: string;
    }
  | { readonly type: "COMPLETE_SCENARIO" }
  | { readonly type: "RESET" };
