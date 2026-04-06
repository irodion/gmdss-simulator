import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "./helpers/test-app.ts";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("API scaffold", () => {
  test("health check returns ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  test("unknown route returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/nonexistent",
    });

    expect(res.statusCode).toBe(404);
  });
});
