import { describe, expect, test } from "vite-plus/test";

import { MockSttAdapter } from "../../src/services/ai/mock-stt.ts";
import { MockLlmAdapter } from "../../src/services/ai/mock-llm.ts";
import { MockTtsAdapter } from "../../src/services/ai/mock-tts.ts";
import {
  FallbackSttAdapter,
  FallbackLlmAdapter,
  FallbackTtsAdapter,
} from "../../src/services/ai/fallback-wrapper.ts";

describe("FallbackSttAdapter", () => {
  test("uses primary when it succeeds", async () => {
    const primary = new MockSttAdapter({ text: "PRIMARY", delayMs: 0 });
    const fallback = new MockSttAdapter({ text: "FALLBACK", delayMs: 0 });
    const adapter = new FallbackSttAdapter(primary, fallback);

    const result = await adapter.transcribe(Buffer.from("audio"), {
      mimeType: "audio/webm",
      language: "en",
    });

    expect(result.text).toBe("PRIMARY");
    expect(result.provider).toBe("mock");
  });

  test("uses fallback when primary fails", async () => {
    const primary = new MockSttAdapter({ shouldFail: true, delayMs: 0 });
    const fallback = new MockSttAdapter({ text: "FALLBACK", delayMs: 0 });
    const adapter = new FallbackSttAdapter(primary, fallback);

    const result = await adapter.transcribe(Buffer.from("audio"), {
      mimeType: "audio/webm",
      language: "en",
    });

    expect(result.text).toBe("FALLBACK");
    expect(result.provider).toContain("fallback");
  });

  test("throws when both primary and fallback fail", async () => {
    const primary = new MockSttAdapter({ shouldFail: true, delayMs: 0 });
    const fallback = new MockSttAdapter({
      shouldFail: true,
      errorMessage: "Both failed",
      delayMs: 0,
    });
    const adapter = new FallbackSttAdapter(primary, fallback);

    await expect(
      adapter.transcribe(Buffer.from("audio"), { mimeType: "audio/webm", language: "en" }),
    ).rejects.toThrow("Both failed");
  });
});

describe("FallbackLlmAdapter", () => {
  const prompt = {
    systemPrompt: "You are a coast station.",
    messages: [{ role: "user" as const, content: "RADIO CHECK" }],
  };

  test("uses primary when it succeeds", async () => {
    const primary = new MockLlmAdapter({ text: "PRIMARY RESPONSE", delayMs: 0 });
    const fallback = new MockLlmAdapter({ text: "FALLBACK RESPONSE", delayMs: 0 });
    const adapter = new FallbackLlmAdapter(primary, fallback);

    const result = await adapter.generateResponse(prompt);

    expect(result.text).toBe("PRIMARY RESPONSE");
  });

  test("uses fallback when primary fails", async () => {
    const primary = new MockLlmAdapter({ shouldFail: true, delayMs: 0 });
    const fallback = new MockLlmAdapter({ text: "FALLBACK RESPONSE", delayMs: 0 });
    const adapter = new FallbackLlmAdapter(primary, fallback);

    const result = await adapter.generateResponse(prompt);

    expect(result.text).toBe("FALLBACK RESPONSE");
    expect(result.provider).toContain("fallback");
  });
});

describe("FallbackTtsAdapter", () => {
  test("uses primary when it succeeds", async () => {
    const primary = new MockTtsAdapter({ delayMs: 0, silenceBytes: 100 });
    const fallback = new MockTtsAdapter({ delayMs: 0, silenceBytes: 200 });
    const adapter = new FallbackTtsAdapter(primary, fallback);

    const result = await adapter.synthesize("Hello", { voiceId: "alloy" });

    // Primary silence buffer: 44 header + 100*2 data = 244 bytes
    expect(result.audio.length).toBe(244);
    expect(result.provider).toBe("mock");
  });

  test("uses fallback when primary fails", async () => {
    const primary = new MockTtsAdapter({ shouldFail: true, delayMs: 0 });
    const fallback = new MockTtsAdapter({ delayMs: 0 });
    const adapter = new FallbackTtsAdapter(primary, fallback);

    const result = await adapter.synthesize("Hello", { voiceId: "alloy" });

    expect(result.provider).toContain("fallback");
  });
});
