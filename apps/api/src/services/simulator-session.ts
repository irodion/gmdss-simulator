/**
 * Simulator session — per-WebSocket-connection state.
 * Tracks scenario, turns, active turn, and timing.
 */

import type {
  ScenarioDefinition,
  Turn,
  ScoreBreakdown,
  RubricDefinition,
} from "@gmdss-simulator/utils";

import type { AdapterSet, StationPersona, PersonaContext } from "./ai/types.ts";
import { getPersona } from "./ai/personas.ts";

export interface SimulatorSession {
  readonly id: string;
  readonly userId: string;
  readonly scenario: ScenarioDefinition;
  readonly rubric: RubricDefinition;
  readonly adapters: AdapterSet;
  readonly persona: StationPersona;
  readonly personaContext: PersonaContext;
  turns: Turn[];
  latestScore: ScoreBreakdown | null;
  activeTurnId: number;
  activeAbortController: AbortController | null;
  /** Resolves when the active turn's pipeline completes (success or failure). */
  activeTurnPromise: Promise<void> | null;
  startedAt: number;
  providerMeta: {
    sttProvider?: string;
    llmProvider?: string;
    llmPromptHash?: string;
    ttsProvider?: string;
    sttConfidences: number[];
    fallbackTurns: number[];
  };
}

export function createSession(opts: {
  id: string;
  userId: string;
  scenario: ScenarioDefinition;
  rubric: RubricDefinition;
  adapters: AdapterSet;
}): SimulatorSession {
  const persona = getPersona(opts.scenario.stationPersona);

  const personaContext: PersonaContext = {
    stationName: opts.scenario.stationName ?? persona.defaultCallsign,
    callsign: persona.defaultCallsign,
    mmsi: persona.defaultMmsi,
    scenarioDescription: opts.scenario.description,
    vesselName: opts.scenario.vessel.name,
    vesselCallsign: opts.scenario.vessel.callsign,
    vesselMmsi: opts.scenario.vessel.mmsi,
  };

  return {
    id: opts.id,
    userId: opts.userId,
    scenario: opts.scenario,
    rubric: opts.rubric,
    adapters: opts.adapters,
    persona,
    personaContext,
    turns: [],
    latestScore: null,
    activeTurnId: -1,
    activeAbortController: null,
    activeTurnPromise: null,
    startedAt: Date.now(),
    providerMeta: {
      sttConfidences: [],
      fallbackTurns: [],
    },
  };
}

/**
 * Cancel the currently active turn's processing pipeline.
 */
export function cancelActiveTurn(session: SimulatorSession): void {
  if (session.activeAbortController) {
    session.activeAbortController.abort();
    session.activeAbortController = null;
  }
}

/**
 * Check if a turn ID is stale (older than the current active turn).
 */
export function isStaleTurn(session: SimulatorSession, turnId: number): boolean {
  return turnId < session.activeTurnId;
}

/**
 * Add a student turn to the session transcript.
 */
export function addStudentTurn(
  session: SimulatorSession,
  text: string,
  channel: number,
  durationMs: number,
): void {
  session.turns.push({
    index: session.turns.length,
    speaker: "student",
    text,
    timestamp: Date.now(),
    channel,
    durationMs,
  });
}

/**
 * Add a station response turn to the session transcript.
 */
export function addStationTurn(session: SimulatorSession, text: string, channel: number): void {
  session.turns.push({
    index: session.turns.length,
    speaker: "station",
    text,
    timestamp: Date.now(),
    channel,
    durationMs: 0,
  });
}
