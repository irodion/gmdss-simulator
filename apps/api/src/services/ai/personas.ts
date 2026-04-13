/**
 * Station persona definitions and system prompt builder.
 *
 * Each persona represents a station the AI can play during a scenario.
 * The system prompt follows IMO SMCP rules and constrains the LLM to
 * respond only in proper marine radiotelephone protocol.
 */

import type { LlmMessage, PersonaContext, StationPersona, StationPersonaId } from "./types.ts";

export const PERSONAS: Record<StationPersonaId, StationPersona> = {
  COAST_GUARD_MRCC: {
    id: "COAST_GUARD_MRCC",
    label: "Coast Guard / MRCC",
    defaultCallsign: "RESCUE CENTRE",
    defaultMmsi: "002320001",
    roleDescription:
      "a Maritime Rescue Coordination Centre (MRCC) operator. You coordinate search and rescue operations, respond to distress alerts, and manage emergency communications.",
    voiceId: "onyx",
  },
  PORT_CONTROL_VTS: {
    id: "PORT_CONTROL_VTS",
    label: "Port Control / VTS",
    defaultCallsign: "PORT CONTROL",
    defaultMmsi: "002320002",
    roleDescription:
      "a Vessel Traffic Service (VTS) operator at a port control centre. You manage vessel traffic, provide port entry instructions, and relay traffic information.",
    voiceId: "echo",
  },
  VESSEL: {
    id: "VESSEL",
    label: "Another Vessel",
    defaultCallsign: "NORDIC STAR",
    defaultMmsi: "219876543",
    roleDescription:
      "a motor vessel operating in the same waters. You communicate ship-to-ship, may offer assistance in distress situations, and relay messages when needed.",
    voiceId: "fable",
  },
  COAST_STATION: {
    id: "COAST_STATION",
    label: "Coast Station",
    defaultCallsign: "RADIO",
    defaultMmsi: "002320003",
    roleDescription:
      "a coast radio station handling routine radio traffic, link calls, and weather broadcasts. You are professional, neutral, and procedural.",
    voiceId: "alloy",
  },
  FISHING_VESSEL: {
    id: "FISHING_VESSEL",
    label: "Fishing Vessel",
    defaultCallsign: "MARIA",
    defaultMmsi: "227654321",
    roleDescription:
      "a fishing vessel. You communicate in correct but slightly informal marine radio style. You broadcast safety messages and respond to routine calls.",
    voiceId: "nova",
  },
};

/** Map legacy scenario persona IDs to canonical StationPersonaId values. */
const PERSONA_ALIASES: Record<string, StationPersonaId> = {
  PORT_CONTROL: "PORT_CONTROL_VTS",
};

/**
 * Look up a persona by ID.
 * Falls back to COAST_STATION for unknown IDs to avoid runtime errors.
 */
export function getPersona(id: string): StationPersona {
  if (id in PERSONAS) {
    return PERSONAS[id as StationPersonaId];
  }
  const aliased = PERSONA_ALIASES[id];
  if (aliased) {
    return PERSONAS[aliased];
  }
  return PERSONAS.COAST_STATION;
}

/**
 * Build the LLM system prompt for a station persona in a given scenario context.
 *
 * The prompt constrains the LLM to:
 * - Respond ONLY in standard marine radiotelephone protocol (IMO SMCP)
 * - Use correct prowords (OVER, OUT, ROGER, SAY AGAIN, CORRECTION)
 * - Use NATO/ITU phonetic alphabet for spelling
 * - Keep transmissions concise (radio, not conversation)
 * - Match communication priority (distress > urgency > safety > routine)
 * - Stay in character if the student makes protocol errors
 */
export function buildSystemPrompt(persona: StationPersona, context: PersonaContext): string {
  return `You are ${context.stationName}, callsign ${context.callsign}, MMSI ${context.mmsi}.
You are ${persona.roleDescription}

RULES:
- Respond ONLY using standard marine radiotelephone protocol (IMO SMCP).
- Use correct prowords: OVER (expecting reply), OUT (end of communication), ROGER (understood), SAY AGAIN (request repeat), CORRECTION (error fix).
- Use the NATO/ITU phonetic alphabet for spelling (Alpha, Bravo, Charlie, etc.).
- Keep transmissions concise — this is radio, not conversation.
- Match the communication priority: distress > urgency > safety > routine.
- If the student makes a protocol error, respond as a real station would (request clarification, correct channel, etc.) — do not break character.
- Never mention that you are an AI, a language model, or a simulator.
- Never use punctuation that wouldn't be spoken on radio (no parentheses, asterisks, or formatting).
- Always end with OVER if expecting a reply, or OUT if ending communication.

SCENARIO CONTEXT:
${context.scenarioDescription}

STUDENT VESSEL:
- Name: ${context.vesselName}${context.vesselCallsign ? `\n- Callsign: ${context.vesselCallsign}` : ""}${context.vesselMmsi ? `\n- MMSI: ${context.vesselMmsi}` : ""}`;
}

/**
 * Build conversation history from turns for the LLM messages array.
 * Student turns become "user" messages, station turns become "assistant" messages.
 */
export function turnsToLlmMessages(
  turns: ReadonlyArray<{ readonly speaker: "student" | "station"; readonly text: string }>,
): LlmMessage[] {
  return turns.map((turn) => ({
    role: turn.speaker === "student" ? ("user" as const) : ("assistant" as const),
    content: turn.text,
  }));
}
