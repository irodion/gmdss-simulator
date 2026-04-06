import type { FastifyInstance } from "fastify";

export function extractSessionCookie(res: {
  headers: Record<string, string | number | string[] | undefined>;
}): string {
  const setCookie = res.headers["set-cookie"];
  if (!setCookie) return "";
  const cookies = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
  return cookies.map((c) => String(c).split(";")[0]).join("; ");
}

export async function signUpAndGetCookie(app: FastifyInstance, email?: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: {
      email: email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
      password: "SecureP@ss123",
      name: "Test User",
    },
  });
  return extractSessionCookie(res);
}
