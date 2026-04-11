import { createHash } from "node:crypto";

import type { LlmAdapter, LlmPrompt, LlmResult } from "./types.ts";

export interface MockLlmConfig {
  /** Fixed response text. If not set, generates a persona-aware template response. */
  readonly text?: string;
  /** Simulated processing delay in ms */
  readonly delayMs?: number;
  /** If true, generateResponse() rejects with an error */
  readonly shouldFail?: boolean;
  /** Custom error message when shouldFail is true */
  readonly errorMessage?: string;
}

const DEFAULTS: Required<MockLlmConfig> = {
  text: "",
  delayMs: 50,
  shouldFail: false,
  errorMessage: "Mock LLM failure",
};

/**
 * Generate a deterministic template response based on the last user message.
 * Used when no fixed text is configured.
 */
function templateResponse(prompt: LlmPrompt): string {
  const lastUserMessage = [...prompt.messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMessage?.content.toUpperCase() ?? "";

  if (userText.includes("MAYDAY")) {
    return "MAYDAY, THIS IS RESCUE COORDINATION CENTRE, RECEIVED MAYDAY, ALL STATIONS SEELONCE MAYDAY, OUT.";
  }
  if (userText.includes("PAN PAN")) {
    return "ALL STATIONS, THIS IS RESCUE COORDINATION CENTRE, RECEIVED YOUR PAN PAN, OVER.";
  }
  if (userText.includes("SECURITE")) {
    return "ALL STATIONS, THIS IS COAST STATION, ROGER YOUR SECURITE, OUT.";
  }
  if (userText.includes("RADIO CHECK")) {
    return "READING YOU LOUD AND CLEAR, OVER.";
  }
  return "ROGER, OVER.";
}

export class MockLlmAdapter implements LlmAdapter {
  private readonly config: Required<MockLlmConfig>;

  constructor(config: MockLlmConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
  }

  async generateResponse(prompt: LlmPrompt): Promise<LlmResult> {
    if (this.config.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    if (this.config.shouldFail) {
      throw new Error(this.config.errorMessage);
    }

    const text = this.config.text || templateResponse(prompt);
    const promptHash = createHash("sha256").update(prompt.systemPrompt).digest("hex");

    return {
      text,
      provider: "mock",
      promptHash,
      durationMs: this.config.delayMs,
    };
  }
}
