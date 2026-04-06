import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import { createTestApp } from "./helpers/test-app.ts";
import { extractSessionCookie } from "./helpers/auth.ts";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

async function signUp(email?: string, password = "SecureP@ss123", name = "Test User") {
  return app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email: email ?? uniqueEmail("user"), password, name },
  });
}

async function signIn(email: string, password = "SecureP@ss123") {
  return app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    payload: { email, password },
  });
}

describe("POST /api/auth/sign-up/email", () => {
  test("creates a new user account", async () => {
    const email = uniqueEmail("signup");
    const res = await signUp(email);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.user.name).toBe("Test User");
  });

  test("returns error for duplicate email", async () => {
    const email = uniqueEmail("dup");
    await signUp(email);
    const res = await signUp(email);
    expect(res.statusCode).not.toBe(200);
  });

  test("sets session cookie on signup", async () => {
    const res = await signUp();
    expect(res.statusCode).toBe(200);
    const cookie = extractSessionCookie(res);
    expect(cookie).toBeTruthy();
  });
});

describe("POST /api/auth/sign-in/email", () => {
  test("returns session on correct credentials", async () => {
    const email = uniqueEmail("signin");
    await signUp(email);
    const res = await signIn(email);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  test("returns error for wrong password", async () => {
    const email = uniqueEmail("wrongpw");
    await signUp(email);
    const res = await signIn(email, "wrongpassword");
    expect(res.statusCode).not.toBe(200);
  });

  test("returns error for non-existent email", async () => {
    const res = await signIn(uniqueEmail("noone"));
    expect(res.statusCode).not.toBe(200);
  });
});

describe("GET /api/auth/get-session", () => {
  test("returns session with valid cookie", async () => {
    const email = uniqueEmail("session");
    const signupRes = await signUp(email);
    const cookie = extractSessionCookie(signupRes);

    const res = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  test("returns null without cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
    });

    const body = res.json();
    expect(body === null || !body?.user).toBe(true);
  });
});

describe("POST /api/auth/sign-out", () => {
  test("invalidates session", async () => {
    const signupRes = await signUp();
    const cookie = extractSessionCookie(signupRes);

    await app.inject({
      method: "POST",
      url: "/api/auth/sign-out",
      headers: { cookie },
    });

    const sessionRes = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { cookie },
    });

    const body = sessionRes.json();
    expect(body === null || !body?.user).toBe(true);
  });
});

describe("protected routes", () => {
  test("returns 401 without session", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules",
    });
    expect(res.statusCode).toBe(401);
  });

  test("allows access with valid session", async () => {
    const signupRes = await signUp();
    const cookie = extractSessionCookie(signupRes);

    const res = await app.inject({
      method: "GET",
      url: "/api/content/modules",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });
});
