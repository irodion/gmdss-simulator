import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "@gmdss-simulator/db";

export function createAuth(
  db: Database,
  opts: { secret: string; baseURL: string; appURL: string },
) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: opts.secret,
    baseURL: opts.baseURL,
    basePath: "/api/auth",
    appName: "GMDSS Simulator",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // update session every day
    },
    trustedOrigins: [opts.appURL],
    plugins: [twoFactor()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
