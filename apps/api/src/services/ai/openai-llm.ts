/**
 * OpenAI-compatible LLM adapter.
 * Works with OpenAI, OpenRouter, or any OpenAI-compatible chat completions API.
 */

import { createHash } from "node:crypto";

import OpenAI from "openai";

import type { LlmAdapter, LlmPrompt, LlmResult } from "./types.ts";

export interface OpenAiLlmConfig {
  readonly baseUrl?: string;
  readonly apiKey: string;
  readonly model?: string;
}

export class OpenAiLlmAdapter implements LlmAdapter {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: OpenAiLlmConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
    });
    this.model = config.model ?? "gpt-4o-mini";
  }

  async generateResponse(prompt: LlmPrompt): Promise<LlmResult> {
    const start = Date.now();
    const promptHash = createHash("sha256").update(prompt.systemPrompt).digest("hex");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: prompt.systemPrompt },
      ...prompt.messages.map(
        (m) =>
          ({
            role: m.role,
            content: m.content,
          }) satisfies OpenAI.Chat.Completions.ChatCompletionMessageParam,
      ),
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: prompt.maxTokens ?? 300,
      temperature: 0.3, // Low temperature for consistent, protocol-correct responses
    });

    const text = response.choices[0]?.message.content ?? "";
    const durationMs = Date.now() - start;

    return {
      text: text.trim(),
      provider: `openai/${this.model}`,
      promptHash,
      durationMs,
    };
  }
}
