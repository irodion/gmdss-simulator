import { describe, expect, test } from "vite-plus/test";

import { processTurn, type TurnContext } from "../../src/services/ai-pipeline.ts";
import { MockSttAdapter } from "../../src/services/ai/mock-stt.ts";
import { MockLlmAdapter } from "../../src/services/ai/mock-llm.ts";
import { MockTtsAdapter } from "../../src/services/ai/mock-tts.ts";
import { PERSONAS } from "../../src/services/ai/personas.ts";
import type { RubricDefinition } from "@gmdss-simulator/utils";

const MOCK_RUBRIC: RubricDefinition = {
  id: "test-rubric",
  version: "1.0.0",
  category: "routine",
  requiredFields: [
    {
      id: "station_name",
      label: "Station name",
      patterns: ["ANYTOWN RADIO"],
      required: true,
    },
  ],
  prowordRules: [{ id: "over", label: "OVER", pattern: "\\bOVER\\b" }],
  sequenceRules: { fieldOrder: ["station_name", "over"] },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

function makeContext(overrides?: Partial<TurnContext>): TurnContext {
  return {
    persona: PERSONAS.COAST_STATION,
    personaContext: {
      stationName: "ANYTOWN RADIO",
      callsign: "ANYTOWN",
      mmsi: "002320003",
      scenarioDescription: "Radio check scenario",
      vesselName: "BLUE DUCK",
      vesselCallsign: "5BCD2",
    },
    rubric: MOCK_RUBRIC,
    requiredChannel: 16,
    currentChannel: 16,
    previousTurns: [],
    ...overrides,
  };
}

function makeAdapters(
  sttConfig?: ConstructorParameters<typeof MockSttAdapter>[0],
  llmConfig?: ConstructorParameters<typeof MockLlmAdapter>[0],
  ttsConfig?: ConstructorParameters<typeof MockTtsAdapter>[0],
) {
  return {
    stt: new MockSttAdapter({ delayMs: 0, ...sttConfig }),
    llm: new MockLlmAdapter({ delayMs: 0, ...llmConfig }),
    tts: new MockTtsAdapter({ delayMs: 0, ...ttsConfig }),
  };
}

describe("processTurn", () => {
  test("processes text input through full pipeline", async () => {
    const result = await processTurn(
      { turnId: 0, text: "ANYTOWN RADIO THIS IS BLUE DUCK RADIO CHECK OVER" },
      makeContext(),
      makeAdapters(),
    );

    expect(result.turnId).toBe(0);
    expect(result.transcript).toContain("ANYTOWN RADIO");
    expect(result.sttConfidence).toBe(1);
    expect(result.sttProvider).toBe("text-input");
    expect(result.score.overall).toBeGreaterThan(0);
    expect(result.responseText).toBeTruthy();
    expect(result.responseAudio).toBeInstanceOf(Buffer);
    expect(result.llmProvider).toBe("mock");
    expect(result.ttsProvider).toBe("mock");
    expect(result.llmPromptHash).toHaveLength(64);
  });

  test("processes audio input through STT first", async () => {
    const result = await processTurn(
      { turnId: 1, audio: Buffer.from("fake-audio"), audioMimeType: "audio/webm" },
      makeContext(),
      makeAdapters({ text: "ANYTOWN RADIO THIS IS BLUE DUCK OVER" }),
    );

    expect(result.sttProvider).toBe("mock");
    expect(result.sttConfidence).toBe(0.92);
    expect(result.transcript).toContain("ANYTOWN RADIO");
  });

  test("throws when neither audio nor text provided", async () => {
    await expect(processTurn({ turnId: 0 }, makeContext(), makeAdapters())).rejects.toThrow(
      "Turn must have either audio or text input",
    );
  });

  test("cancellation aborts pipeline", async () => {
    const controller = new AbortController();
    controller.abort(); // abort immediately

    await expect(
      processTurn({ turnId: 0, text: "TEST" }, makeContext(), makeAdapters(), controller.signal),
    ).rejects.toThrow("Turn cancelled");
  });

  test("scores against rubric correctly", async () => {
    // Transcript that mentions station name + OVER → should score well
    const result = await processTurn(
      { turnId: 0, text: "ANYTOWN RADIO THIS IS BLUE DUCK RADIO CHECK OVER" },
      makeContext(),
      makeAdapters(),
    );

    const fieldsDim = result.score.dimensions.find((d) => d.id === "required_fields");
    expect(fieldsDim?.matchedItems).toContain("Station name");
  });

  test("LLM response depends on input content", async () => {
    const maydayResult = await processTurn(
      { turnId: 0, text: "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK" },
      makeContext(),
      makeAdapters(),
    );

    const routineResult = await processTurn(
      { turnId: 0, text: "RADIO CHECK ON CHANNEL ONE SIX" },
      makeContext(),
      makeAdapters(),
    );

    // Mock LLM returns different template responses based on content
    expect(maydayResult.responseText).toContain("MAYDAY");
    expect(routineResult.responseText).toContain("LOUD AND CLEAR");
  });
});
