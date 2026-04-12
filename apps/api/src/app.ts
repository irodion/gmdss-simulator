import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";

import dbPlugin from "./plugins/db.ts";
import authPlugin from "./plugins/auth.ts";
import redisPlugin from "./plugins/redis.ts";
import contentRoutes from "./routes/content/index.ts";
import progressRoutes from "./routes/progress/index.ts";
import attemptRoutes from "./routes/simulator/attempts.ts";
import simulatorWsRoute from "./routes/simulator/ws.ts";
import { createAdapterSet, type AiConfig } from "./services/ai/adapter-factory.ts";
import type { ScenarioDefinition, RubricDefinition } from "@gmdss-simulator/utils";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, "../../frontend/public/content/en");

async function readFileIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return null;
    throw err;
  }
}

export interface BuildAppOptions {
  logger?: boolean;
  databaseUrl: string;
  redisUrl: string;
  secret: string;
  appUrl?: string;
  apiUrl?: string;
  aiConfig?: AiConfig;
  /** Override path to content directory (for Docker or custom layouts) */
  contentDir?: string;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const appUrl = opts.appUrl ?? "http://localhost:5173";
  const apiUrl = opts.apiUrl ?? "http://localhost:3001";
  const contentDir = opts.contentDir ?? CONTENT_DIR;

  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(cookie);
  await app.register(cors, { origin: appUrl, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(websocket);

  await app.register(dbPlugin, { databaseUrl: opts.databaseUrl });
  await app.register(redisPlugin, { redisUrl: opts.redisUrl });
  await app.register(authPlugin, { secret: opts.secret, baseURL: apiUrl, appURL: appUrl });

  await app.register(contentRoutes, { prefix: "/api/content" });
  await app.register(progressRoutes, { prefix: "/api/progress" });
  await app.register(attemptRoutes, { prefix: "/api/simulator/attempts" });

  const aiConfig: AiConfig = opts.aiConfig ?? { provider: "mock" };
  const adapters = await createAdapterSet(aiConfig);

  const scenarioCache = new Map<
    string,
    { scenario: ScenarioDefinition; rubric: RubricDefinition }
  >();

  await app.register(simulatorWsRoute, {
    prefix: "/api/simulator",
    adapters,
    loadScenario: async (scenarioId: string) => {
      const cached = scenarioCache.get(scenarioId);
      if (cached) return cached;

      const tierDir = getTierDir(scenarioId);
      const scenarioPath = await findScenarioFile(contentDir, tierDir, scenarioId);
      if (!scenarioPath) {
        throw new Error(`Scenario ${scenarioId} not found in ${tierDir}`);
      }
      const scenarioJson = await readFile(scenarioPath, "utf-8");
      const scenario = JSON.parse(scenarioJson) as ScenarioDefinition;

      const rubricPath = resolve(contentDir, "rubrics", `${scenario.rubricId}.json`);
      const rubricJson = await readFileIfExists(rubricPath);
      if (!rubricJson) {
        throw new Error(`Rubric ${scenario.rubricId} not found at ${rubricPath}`);
      }
      const rubric = JSON.parse(rubricJson) as RubricDefinition;

      const entry = { scenario, rubric };
      scenarioCache.set(scenarioId, entry);
      return entry;
    },
  });

  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}

function getTierDir(scenarioId: string): string {
  const tierNum = scenarioId.split(".")[0];
  return `tier-${tierNum}`;
}

/** Find a scenario JSON file by ID prefix (e.g. "1.1" matches "1.1-radio-check.json"). */
async function findScenarioFile(
  contentDir: string,
  tierDir: string,
  scenarioId: string,
): Promise<string | null> {
  const dir = resolve(contentDir, "scenarios", tierDir);
  const prefix = `${scenarioId}-`;
  const files = await readdir(dir).catch(() => []);
  const match = files.find((f) => f.startsWith(prefix) && f.endsWith(".json"));
  return match ? resolve(dir, match) : null;
}
