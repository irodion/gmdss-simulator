import { describe, expect, test } from "vite-plus/test";

import {
  PERSONAS,
  getPersona,
  buildSystemPrompt,
  turnsToLlmMessages,
} from "../../src/services/ai/personas.ts";
import type { PersonaContext, StationPersonaId } from "../../src/services/ai/types.ts";

const ALL_IDS: StationPersonaId[] = [
  "COAST_GUARD_MRCC",
  "PORT_CONTROL_VTS",
  "VESSEL",
  "COAST_STATION",
  "FISHING_VESSEL",
];

const SAMPLE_CONTEXT: PersonaContext = {
  stationName: "ANYTOWN RADIO",
  callsign: "ANYTOWN",
  mmsi: "002320001",
  scenarioDescription: "Standard radio check on Channel 16.",
  vesselName: "BLUE DUCK",
  vesselCallsign: "5BCD2",
  vesselMmsi: "211239680",
};

describe("PERSONAS", () => {
  test("defines exactly 5 personas", () => {
    expect(Object.keys(PERSONAS)).toHaveLength(5);
  });

  test.each(ALL_IDS)("%s has all required fields", (id) => {
    const p = PERSONAS[id];
    expect(p.id).toBe(id);
    expect(p.label).toBeTruthy();
    expect(p.defaultCallsign).toBeTruthy();
    expect(p.defaultMmsi).toBeTruthy();
    expect(p.roleDescription).toBeTruthy();
    expect(p.voiceId).toBeTruthy();
  });

  test("each persona has a unique voiceId", () => {
    const voices = ALL_IDS.map((id) => PERSONAS[id].voiceId);
    expect(new Set(voices).size).toBe(voices.length);
  });
});

describe("getPersona", () => {
  test("returns persona by ID", () => {
    const p = getPersona("COAST_GUARD_MRCC");
    expect(p.id).toBe("COAST_GUARD_MRCC");
  });

  test("resolves PORT_CONTROL alias to PORT_CONTROL_VTS", () => {
    const p = getPersona("PORT_CONTROL");
    expect(p.id).toBe("PORT_CONTROL_VTS");
  });

  test("falls back to COAST_STATION for unknown ID", () => {
    const p = getPersona("UNKNOWN_PERSONA");
    expect(p.id).toBe("COAST_STATION");
  });
});

describe("buildSystemPrompt", () => {
  test("includes station name and callsign", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, SAMPLE_CONTEXT);
    expect(prompt).toContain("ANYTOWN RADIO");
    expect(prompt).toContain("ANYTOWN");
  });

  test("includes MMSI", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, SAMPLE_CONTEXT);
    expect(prompt).toContain("002320001");
  });

  test("includes role description", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_GUARD_MRCC, SAMPLE_CONTEXT);
    expect(prompt).toContain("Maritime Rescue Coordination Centre");
  });

  test("includes IMO SMCP proword rules", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, SAMPLE_CONTEXT);
    expect(prompt).toContain("OVER");
    expect(prompt).toContain("OUT");
    expect(prompt).toContain("ROGER");
    expect(prompt).toContain("SAY AGAIN");
    expect(prompt).toContain("NATO/ITU phonetic alphabet");
  });

  test("includes scenario context", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, SAMPLE_CONTEXT);
    expect(prompt).toContain("Standard radio check on Channel 16");
  });

  test("includes student vessel details", () => {
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, SAMPLE_CONTEXT);
    expect(prompt).toContain("BLUE DUCK");
    expect(prompt).toContain("5BCD2");
    expect(prompt).toContain("211239680");
  });

  test("omits callsign/MMSI lines when not provided", () => {
    const context: PersonaContext = {
      ...SAMPLE_CONTEXT,
      vesselCallsign: undefined,
      vesselMmsi: undefined,
    };
    const prompt = buildSystemPrompt(PERSONAS.COAST_STATION, context);
    expect(prompt).not.toContain("Callsign:");
    expect(prompt).not.toContain("MMSI:");
    expect(prompt).toContain("BLUE DUCK");
  });

  test.each(ALL_IDS)("produces non-empty prompt for %s", (id) => {
    const prompt = buildSystemPrompt(PERSONAS[id], SAMPLE_CONTEXT);
    expect(prompt.length).toBeGreaterThan(200);
  });
});

describe("turnsToLlmMessages", () => {
  test("maps student turns to user role", () => {
    const messages = turnsToLlmMessages([{ speaker: "student", text: "RADIO CHECK" }]);
    expect(messages).toEqual([{ role: "user", content: "RADIO CHECK" }]);
  });

  test("maps station turns to assistant role", () => {
    const messages = turnsToLlmMessages([{ speaker: "station", text: "ROGER" }]);
    expect(messages).toEqual([{ role: "assistant", content: "ROGER" }]);
  });

  test("preserves turn order in conversation", () => {
    const messages = turnsToLlmMessages([
      { speaker: "student", text: "RADIO CHECK" },
      { speaker: "station", text: "LOUD AND CLEAR" },
      { speaker: "student", text: "ROGER OUT" },
    ]);

    expect(messages).toHaveLength(3);
    expect(messages[0]?.role).toBe("user");
    expect(messages[1]?.role).toBe("assistant");
    expect(messages[2]?.role).toBe("user");
  });

  test("returns empty array for no turns", () => {
    expect(turnsToLlmMessages([])).toEqual([]);
  });
});
