import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  APP_URL: z.string().url(),
  API_URL: z.string().url().default("http://localhost:3001"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // AI provider configuration
  AI_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  /** Base URL for OpenAI-compatible API (e.g. https://openrouter.ai/api/v1) */
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AI_STT_MODEL: z.string().default("whisper-1"),
  AI_LLM_MODEL: z.string().default("gpt-4o-mini"),
  AI_TTS_MODEL: z.string().default("tts-1"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}
