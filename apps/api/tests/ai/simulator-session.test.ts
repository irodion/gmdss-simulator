import { describe, expect, test } from "vite-plus/test";

import {
  createSession,
  cancelActiveTurn,
  isStaleTurn,
  addStudentTurn,
  addStationTurn,
} from "../../src/services/simulator-session.ts";
import { MockSttAdapter } from "../../src/services/ai/mock-stt.ts";
import { MockLlmAdapter } from "../../src/services/ai/mock-llm.ts";
import { MockTtsAdapter } from "../../src/services/ai/mock-tts.ts";
import type { ScenarioDefinition, RubricDefinition } from "@gmdss-simulator/utils";

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "1.1",
  tier: 1,
  category: "routine",
  title: "Radio Check",
  description: "Test scenario",
  stationPersona: "COAST_STATION",
  stationName: "ANYTOWN RADIO",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", mmsi: "211239680" },
  requiredChannel: 16,
  task: "Perform a radio check",
  scriptedResponses: [],
  rubricId: "v1/routine",
};

const MOCK_RUBRIC: RubricDefinition = {
  id: "v1/routine",
  version: "1.0.0",
  category: "routine",
  requiredFields: [],
  prowordRules: [],
  sequenceRules: { fieldOrder: [] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

const MOCK_ADAPTERS = {
  stt: new MockSttAdapter(),
  llm: new MockLlmAdapter(),
  tts: new MockTtsAdapter(),
};

describe("createSession", () => {
  test("creates session with correct initial state", () => {
    const session = createSession({
      id: "test-id",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    expect(session.id).toBe("test-id");
    expect(session.userId).toBe("user-1");
    expect(session.turns).toHaveLength(0);
    expect(session.activeTurnId).toBe(-1);
    expect(session.activeAbortController).toBeNull();
    expect(session.persona.id).toBe("COAST_STATION");
    expect(session.personaContext.stationName).toBe("ANYTOWN RADIO");
    expect(session.personaContext.vesselName).toBe("BLUE DUCK");
  });

  test("resolves persona from scenario stationPersona field", () => {
    const session = createSession({
      id: "test-id",
      userId: "user-1",
      scenario: { ...MOCK_SCENARIO, stationPersona: "COAST_GUARD_MRCC" },
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    expect(session.persona.id).toBe("COAST_GUARD_MRCC");
  });
});

describe("cancelActiveTurn", () => {
  test("aborts the active controller", () => {
    const session = createSession({
      id: "test",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    const controller = new AbortController();
    session.activeAbortController = controller;

    cancelActiveTurn(session);

    expect(controller.signal.aborted).toBe(true);
    expect(session.activeAbortController).toBeNull();
  });
});

describe("isStaleTurn", () => {
  test("returns true for older turn IDs", () => {
    const session = createSession({
      id: "test",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });
    session.activeTurnId = 5;

    expect(isStaleTurn(session, 3)).toBe(true);
    expect(isStaleTurn(session, 5)).toBe(false);
    expect(isStaleTurn(session, 6)).toBe(false);
  });
});

describe("addStudentTurn", () => {
  test("adds a turn with correct fields", () => {
    const session = createSession({
      id: "test",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    addStudentTurn(session, "RADIO CHECK", 16, 3000);

    expect(session.turns).toHaveLength(1);
    expect(session.turns[0]?.speaker).toBe("student");
    expect(session.turns[0]?.text).toBe("RADIO CHECK");
    expect(session.turns[0]?.channel).toBe(16);
    expect(session.turns[0]?.durationMs).toBe(3000);
  });
});

describe("addStationTurn", () => {
  test("adds a station turn", () => {
    const session = createSession({
      id: "test",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    addStationTurn(session, "ROGER OUT", 16);

    expect(session.turns).toHaveLength(1);
    expect(session.turns[0]?.speaker).toBe("station");
    expect(session.turns[0]?.text).toBe("ROGER OUT");
  });

  test("maintains correct turn indexing", () => {
    const session = createSession({
      id: "test",
      userId: "user-1",
      scenario: MOCK_SCENARIO,
      rubric: MOCK_RUBRIC,
      adapters: MOCK_ADAPTERS,
    });

    addStudentTurn(session, "RADIO CHECK", 16, 3000);
    addStationTurn(session, "ROGER", 16);

    expect(session.turns[0]?.index).toBe(0);
    expect(session.turns[1]?.index).toBe(1);
  });
});
