import { describe, expect, test } from "vite-plus/test";

import { MockSttAdapter } from "../../src/services/ai/mock-stt.ts";
import { MockLlmAdapter } from "../../src/services/ai/mock-llm.ts";
import { MockTtsAdapter } from "../../src/services/ai/mock-tts.ts";
import { createAdapterSet } from "../../src/services/ai/adapter-factory.ts";
import type { LlmPrompt } from "../../src/services/ai/types.ts";

// ── MockSttAdapter ──────────────────────────────────────────────

describe("MockSttAdapter", () => {
  test("returns default transcription", async () => {
    const stt = new MockSttAdapter({ delayMs: 0 });
    const result = await stt.transcribe(Buffer.from("audio"), {
      mimeType: "audio/webm",
      language: "en",
    });

    expect(result.text).toContain("RADIO CHECK");
    expect(result.confidence).toBe(0.92);
    expect(result.provider).toBe("mock");
  });

  test("returns custom text", async () => {
    const stt = new MockSttAdapter({ text: "MAYDAY MAYDAY MAYDAY", delayMs: 0 });
    const result = await stt.transcribe(Buffer.from("audio"), {
      mimeType: "audio/webm",
      language: "en",
    });

    expect(result.text).toBe("MAYDAY MAYDAY MAYDAY");
  });

  test("throws when shouldFail is true", async () => {
    const stt = new MockSttAdapter({ shouldFail: true, delayMs: 0 });

    await expect(
      stt.transcribe(Buffer.from("audio"), { mimeType: "audio/webm", language: "en" }),
    ).rejects.toThrow("Mock STT failure");
  });

  test("throws with custom error message", async () => {
    const stt = new MockSttAdapter({
      shouldFail: true,
      errorMessage: "Service unavailable",
      delayMs: 0,
    });

    await expect(
      stt.transcribe(Buffer.from("audio"), { mimeType: "audio/webm", language: "en" }),
    ).rejects.toThrow("Service unavailable");
  });
});

// ── MockLlmAdapter ──────────────────────────────────────────────

describe("MockLlmAdapter", () => {
  const basePrompt: LlmPrompt = {
    systemPrompt: "You are a coast station.",
    messages: [{ role: "user", content: "RADIO CHECK ON CHANNEL ONE SIX OVER" }],
  };

  test("returns template response for radio check", async () => {
    const llm = new MockLlmAdapter({ delayMs: 0 });
    const result = await llm.generateResponse(basePrompt);

    expect(result.text).toContain("LOUD AND CLEAR");
    expect(result.provider).toBe("mock");
    expect(result.promptHash).toHaveLength(64); // SHA-256 hex
  });

  test("returns MAYDAY response for distress", async () => {
    const llm = new MockLlmAdapter({ delayMs: 0 });
    const prompt: LlmPrompt = {
      systemPrompt: "You are an MRCC.",
      messages: [{ role: "user", content: "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK" }],
    };
    const result = await llm.generateResponse(prompt);

    expect(result.text).toContain("MAYDAY");
    expect(result.text).toContain("RESCUE COORDINATION CENTRE");
  });

  test("returns PAN PAN response for urgency", async () => {
    const llm = new MockLlmAdapter({ delayMs: 0 });
    const prompt: LlmPrompt = {
      systemPrompt: "You are an MRCC.",
      messages: [{ role: "user", content: "PAN PAN PAN PAN PAN PAN" }],
    };
    const result = await llm.generateResponse(prompt);

    expect(result.text).toContain("PAN PAN");
  });

  test("returns fixed text when configured", async () => {
    const llm = new MockLlmAdapter({ text: "ROGER, OUT.", delayMs: 0 });
    const result = await llm.generateResponse(basePrompt);

    expect(result.text).toBe("ROGER, OUT.");
  });

  test("generates deterministic promptHash from system prompt", async () => {
    const llm = new MockLlmAdapter({ delayMs: 0 });
    const r1 = await llm.generateResponse(basePrompt);
    const r2 = await llm.generateResponse(basePrompt);

    expect(r1.promptHash).toBe(r2.promptHash);
  });

  test("throws when shouldFail is true", async () => {
    const llm = new MockLlmAdapter({ shouldFail: true, delayMs: 0 });

    await expect(llm.generateResponse(basePrompt)).rejects.toThrow("Mock LLM failure");
  });
});

// ── MockTtsAdapter ──────────────────────────────────────────────

describe("MockTtsAdapter", () => {
  test("returns WAV audio buffer", async () => {
    const tts = new MockTtsAdapter({ delayMs: 0 });
    const result = await tts.synthesize("Hello", { voiceId: "alloy" });

    expect(result.audio).toBeInstanceOf(Buffer);
    expect(result.audio.length).toBeGreaterThan(44); // WAV header is 44 bytes
    expect(result.mimeType).toBe("audio/wav");
    expect(result.provider).toBe("mock");
  });

  test("produces valid WAV header", async () => {
    const tts = new MockTtsAdapter({ delayMs: 0 });
    const result = await tts.synthesize("Hello", { voiceId: "alloy" });
    const header = result.audio.toString("ascii", 0, 4);

    expect(header).toBe("RIFF");
    expect(result.audio.toString("ascii", 8, 12)).toBe("WAVE");
  });

  test("throws when shouldFail is true", async () => {
    const tts = new MockTtsAdapter({ shouldFail: true, delayMs: 0 });

    await expect(tts.synthesize("Hello", { voiceId: "alloy" })).rejects.toThrow("Mock TTS failure");
  });
});

// ── Adapter Factory ─────────────────────────────────────────────

describe("createAdapterSet", () => {
  test("creates mock adapter set", async () => {
    const set = await createAdapterSet({ provider: "mock" });

    expect(set.stt).toBeInstanceOf(MockSttAdapter);
    expect(set.llm).toBeInstanceOf(MockLlmAdapter);
    expect(set.tts).toBeInstanceOf(MockTtsAdapter);
  });

  test("openai provider throws without API key", { timeout: 15_000 }, async () => {
    await expect(createAdapterSet({ provider: "openai" })).rejects.toThrow(
      "AI_API_KEY is required",
    );
  });
});
