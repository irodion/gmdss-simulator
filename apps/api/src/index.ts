import { loadConfig } from "./config.ts";
import { buildApp } from "./app.ts";

const config = loadConfig();

const app = await buildApp({
  logger: true,
  databaseUrl: config.DATABASE_URL,
  redisUrl: config.REDIS_URL,
  secret: config.BETTER_AUTH_SECRET,
  appUrl: config.APP_URL,
  apiUrl: `http://0.0.0.0:${config.PORT}`,
});

try {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
