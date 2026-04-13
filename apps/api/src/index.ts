import { loadConfig } from "./config.ts";
import { buildApp } from "./app.ts";

try {
  const config = loadConfig();
  const app = await buildApp({
    logger: true,
    databaseUrl: config.DATABASE_URL,
    redisUrl: config.REDIS_URL,
    secret: config.BETTER_AUTH_SECRET,
    appUrl: config.APP_URL,
    apiUrl: config.API_URL,
    aiConfig: {
      provider: config.AI_PROVIDER,
      baseUrl: config.AI_BASE_URL,
      apiKey: config.AI_API_KEY,
      sttModel: config.AI_STT_MODEL,
      llmModel: config.AI_LLM_MODEL,
      ttsModel: config.AI_TTS_MODEL,
    },
  });
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
