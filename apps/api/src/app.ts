import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";

import dbPlugin from "./plugins/db.ts";
import authPlugin from "./plugins/auth.ts";
import redisPlugin from "./plugins/redis.ts";
import contentRoutes from "./routes/content/index.ts";
import progressRoutes from "./routes/progress/index.ts";

export interface BuildAppOptions {
  logger?: boolean;
  databaseUrl: string;
  redisUrl: string;
  secret: string;
  appUrl?: string;
  apiUrl?: string;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const appUrl = opts.appUrl ?? "http://localhost:5173";
  const apiUrl = opts.apiUrl ?? "http://localhost:3001";

  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(cookie);
  await app.register(cors, { origin: appUrl, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  await app.register(dbPlugin, { databaseUrl: opts.databaseUrl });
  await app.register(redisPlugin, { redisUrl: opts.redisUrl });
  await app.register(authPlugin, { secret: opts.secret, baseURL: apiUrl, appURL: appUrl });

  await app.register(contentRoutes, { prefix: "/api/content" });
  await app.register(progressRoutes, { prefix: "/api/progress" });

  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
