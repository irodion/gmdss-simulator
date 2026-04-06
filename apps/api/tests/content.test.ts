import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vite-plus/test";

import { createTestApp } from "./helpers/test-app.ts";
import { signUpAndGetCookie } from "./helpers/auth.ts";

let app: FastifyInstance;
let sessionCookie: string;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  sessionCookie = await signUpAndGetCookie(app);
});

function authHeaders() {
  return { cookie: sessionCookie };
}

describe("GET /api/content/modules", () => {
  test("returns all 4 modules in order", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules",
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(4);
    expect(body[0].id).toBe("module-1");
    expect(body[1].id).toBe("module-2");
    expect(body[2].id).toBe("module-3");
    expect(body[3].id).toBe("module-4");
  });

  test("Module 1 is unlocked, Module 2 is locked for new user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules",
      headers: authHeaders(),
    });

    const body = res.json();
    expect(body[0].locked).toBe(false);
    expect(body[1].locked).toBe(true);
  });

  test("returns 401 without authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/content/modules/:id/lessons", () => {
  test("returns ordered lessons for a module", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules/module-1/lessons",
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(6);
    expect(body[0].title).toBe("What is VHF Maritime Radio?");
    expect(body[0].completed).toBe(false);
  });

  test("returns 404 for nonexistent module", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules/nonexistent/lessons",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /api/content/modules/:id/quiz", () => {
  test("returns quiz questions without correct answers", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules/module-1/quiz",
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe("module-1-checkpoint");
    expect(body.passThreshold).toBe(70);
    expect(body.questions.length).toBeGreaterThan(0);

    for (const q of body.questions) {
      expect(q.correct_answer).toBeUndefined();
      expect(q.text).toBeDefined();
      expect(q.options).toBeDefined();
    }
  });
});

describe("GET /api/content/jurisdictions", () => {
  test("returns at least international jurisdiction", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/jurisdictions",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body.some((j: { id: string }) => j.id === "international")).toBe(true);
  });

  test("does not require authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/jurisdictions",
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /api/content/jurisdictions/:id", () => {
  test("returns full channel plan for international", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/jurisdictions/international",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe("international");
    expect(body.callingChannel).toBe(16);
    expect(body.dscChannel).toBe(70);
    expect(body.channelPlan["16"]).toBeDefined();
    expect(body.channelPlan["70"]).toBeDefined();
    expect(body.channelPlan["70"].tx_allowed).toBe(false);
  });

  test("returns 404 for nonexistent jurisdiction", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/jurisdictions/nonexistent",
    });
    expect(res.statusCode).toBe(404);
  });
});
