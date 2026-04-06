import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/app.ts";

const TEST_DB_URL =
  process.env["DATABASE_URL"] ?? "postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev";
const TEST_REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const TEST_SECRET = process.env["BETTER_AUTH_SECRET"] ?? "test-secret-at-least-32-characters-long";

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
