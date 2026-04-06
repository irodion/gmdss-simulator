import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/app.ts";

// These env vars are forwarded from vite.config.ts test.env
const TEST_DB_URL = process.env["DATABASE_URL"]!;
const TEST_REDIS_URL = process.env["REDIS_URL"]!;
const TEST_SECRET = process.env["BETTER_AUTH_SECRET"]!;

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({
    logger: false,
    databaseUrl: TEST_DB_URL,
    redisUrl: TEST_REDIS_URL,
    secret: TEST_SECRET,
    apiUrl: "http://localhost:3001",
  });

  await app.ready();
  return app;
}

export { TEST_SECRET };
