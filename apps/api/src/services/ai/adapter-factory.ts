import type { AdapterSet } from "./types.ts";
import { MockSttAdapter } from "./mock-stt.ts";
import { MockLlmAdapter } from "./mock-llm.ts";
import { MockTtsAdapter } from "./mock-tts.ts";

export type AiProviderType = "openai" | "mock";

export interface AiConfig {
  readonly provider: AiProviderType;
  /** Base URL for OpenAI-compatible API (e.g. OpenRouter) */
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly sttModel?: string;
  readonly llmModel?: string;
  readonly ttsModel?: string;
  /** JSON string mapping StationPersonaId -> TTS voice ID */
  readonly ttsVoiceMap?: string;
}

/**
 * Create an adapter set based on the AI provider configuration.
 *
 * For "mock" provider, returns deterministic mock adapters suitable for testing.
 * For "openai", dynamically imports the OpenAI adapters (Increment 4.2).
 */
export async function createAdapterSet(config: AiConfig): Promise<AdapterSet> {
  switch (config.provider) {
    case "mock":
      return {
        stt: new MockSttAdapter(),
        llm: new MockLlmAdapter(),
        tts: new MockTtsAdapter(),
      };

    case "openai": {
      // Dynamic import to avoid requiring the openai package when using mock provider
      const [{ OpenAiSttAdapter }, { OpenAiLlmAdapter }, { OpenAiTtsAdapter }] = await Promise.all([
        import("./openai-stt.ts"),
        import("./openai-llm.ts"),
        import("./openai-tts.ts"),
      ]);

      const baseUrl = config.baseUrl;
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error("AI_API_KEY is required when AI_PROVIDER=openai");
      }

      return {
        stt: new OpenAiSttAdapter({ baseUrl, apiKey, model: config.sttModel }),
        llm: new OpenAiLlmAdapter({ baseUrl, apiKey, model: config.llmModel }),
        tts: new OpenAiTtsAdapter({ baseUrl, apiKey, model: config.ttsModel }),
      };
    }

    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown AI provider: ${String(_exhaustive)}`);
    }
  }
}
