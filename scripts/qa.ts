/**
 * QA Helper — one-command local development setup.
 *
 * Usage: vp run qa
 *
 * Starts Docker (PostgreSQL + Redis), runs migrations, seeds data,
 * creates a test user, then starts the API and frontend servers.
 */

import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Paths ──

const ROOT = resolve(import.meta.dirname, "..");
const DOCKER_COMPOSE = resolve(ROOT, "docker-compose.dev.yml");
const DB_DIR = resolve(ROOT, "packages/db");
const API_ENTRY = resolve(ROOT, "apps/api/src/index.ts");
const ENV_FILE = resolve(ROOT, ".env");
const ENV_EXAMPLE = resolve(ROOT, ".env.example");

// ── Load .env (create from example if missing) ──

if (!existsSync(ENV_FILE)) {
  if (existsSync(ENV_EXAMPLE)) {
    copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log("  Created .env from .env.example");
  } else {
    console.error("  .env.example not found — create .env manually");
    process.exit(1);
  }
}

for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  const value = trimmed.slice(eq + 1);
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}

// ── Config (read after .env is loaded) ──

const API_PORT = Number(process.env["PORT"] ?? 3001);
const API_URL = process.env["API_URL"] ?? `http://localhost:${API_PORT}`;
const APP_URL = process.env["APP_URL"] ?? "http://localhost:5173";

// Ensure VITE_API_URL is set for the frontend dev server
if (!process.env["VITE_API_URL"]) {
  process.env["VITE_API_URL"] = API_URL;
}

const TEST_USER = {
  name: "Test User",
  email: "test@gmdss.local",
  password: "testpass123",
};

const HEALTH_TIMEOUT_MS = 30_000;
const HEALTH_POLL_MS = 1_000;

// ── TUI helpers ──

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

function ok(msg: string) {
  console.log(`${GREEN}  ✓${RESET} ${msg}`);
}

function fail(msg: string) {
  console.error(`${RED}  ✗${RESET} ${msg}`);
}

function info(msg: string) {
  console.log(`${DIM}  …${RESET} ${msg}`);
}

function banner(msg: string) {
  console.log(`\n${BOLD}━━━ ${msg} ━━━${RESET}\n`);
}

// ── Process tracking for cleanup ──

const children: ChildProcess[] = [];

function killAll() {
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }
}

// ── Shell helpers ──

function run(cmd: string, opts?: { cwd?: string; silent?: boolean }): string {
  try {
    return execSync(cmd, {
      cwd: opts?.cwd ?? ROOT,
      stdio: opts?.silent ? "pipe" : "inherit",
      encoding: "utf8",
      env: { ...process.env, PATH: process.env["PATH"] },
    });
  } catch (err: any) {
    if (opts?.silent) return err.stdout ?? "";
    throw err;
  }
}

function spawnPrefixed(
  label: string,
  cmd: string,
  args: string[],
  opts?: { cwd?: string; env?: Record<string, string> },
): ChildProcess {
  const child = spawn(cmd, args, {
    cwd: opts?.cwd ?? ROOT,
    env: { ...process.env, ...opts?.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = `${DIM}[${label}]${RESET} `;

  child.stdout?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.log(`${prefix}${line}`);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.error(`${prefix}${line}`);
    }
  });

  children.push(child);
  return child;
}

// ── Container runtime detection ──

function hasCommand(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function detectCompose(): string {
  if (hasCommand("docker")) {
    try {
      execSync("docker compose version", { stdio: "pipe" });
      return "docker compose";
    } catch {
      // docker exists but compose plugin missing
    }
  }
  if (hasCommand("podman")) {
    try {
      execSync("podman compose version", { stdio: "pipe" });
      return "podman compose";
    } catch {
      // podman compose plugin not available — try standalone
    }
  }
  if (hasCommand("podman-compose")) {
    return "podman-compose";
  }
  return "";
}

let COMPOSE = "";

// ── Step functions ──

function checkPrerequisites() {
  COMPOSE = detectCompose();
  if (!COMPOSE) {
    fail("No container runtime found. Install Docker Desktop or Podman with podman-compose.");
    process.exit(1);
  }

  const vpPath = resolve(ROOT, "node_modules/.bin/vp");
  if (!existsSync(vpPath)) {
    fail("node_modules/.bin/vp not found. Run: vp install");
    process.exit(1);
  }

  ok(`Prerequisites OK (${COMPOSE}, vp, .env)`);
}

function startDocker() {
  info("Starting container services…");
  run(`${COMPOSE} -f ${DOCKER_COMPOSE} up -d`);
  ok("Container services started (PostgreSQL + Redis)");
}

async function waitForHealth() {
  const start = Date.now();

  info("Waiting for PostgreSQL…");
  while (Date.now() - start < HEALTH_TIMEOUT_MS) {
    try {
      execSync(
        `${COMPOSE} -f ${DOCKER_COMPOSE} exec -T postgres pg_isready -U gmdss -d gmdss_dev`,
        { stdio: "pipe" },
      );
      ok("PostgreSQL healthy");
      break;
    } catch {
      await sleep(HEALTH_POLL_MS);
    }
  }
  if (Date.now() - start >= HEALTH_TIMEOUT_MS) {
    fail("PostgreSQL did not become healthy in time");
    process.exit(1);
  }

  info("Waiting for Redis…");
  const redisStart = Date.now();
  while (Date.now() - redisStart < HEALTH_TIMEOUT_MS) {
    try {
      const out = execSync(`${COMPOSE} -f ${DOCKER_COMPOSE} exec -T redis redis-cli ping`, {
        stdio: "pipe",
        encoding: "utf8",
      });
      if (out.trim() === "PONG") {
        ok("Redis healthy");
        return;
      }
    } catch {
      // retry
    }
    await sleep(HEALTH_POLL_MS);
  }
  fail("Redis did not become healthy in time");
  process.exit(1);
}

function runMigrations() {
  info("Running migrations…");
  run("node_modules/.bin/drizzle-kit migrate", { cwd: DB_DIR });
  ok("Migrations applied");
}

function seedDatabase() {
  info("Seeding database…");
  run(`"${process.execPath}" src/seed.ts`, { cwd: DB_DIR });
  ok("Database seeded (4 modules, 28 lessons, 5 jurisdictions)");
}

function killPort(port: number) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: "utf8", stdio: "pipe" }).trim();
    if (pids) {
      for (const pid of pids.split("\n")) {
        try {
          process.kill(Number(pid), "SIGTERM");
        } catch {
          /* already gone */
        }
      }
      info(`Killed stale process on port ${port}`);
    }
  } catch {
    // nothing listening — fine
  }
}

function startApi(): ChildProcess {
  killPort(API_PORT);
  info("Starting API server…");
  return spawnPrefixed("api", process.execPath, [API_ENTRY]);
}

async function waitForApi(_child: ChildProcess): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < HEALTH_TIMEOUT_MS) {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      if (res.ok) {
        ok(`API server running → ${CYAN}${API_URL}${RESET}`);
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(HEALTH_POLL_MS);
  }
  fail("API server did not become healthy in time");
  process.exit(1);
}

async function createTestUser() {
  info("Creating test user…");
  try {
    const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: APP_URL,
      },
      body: JSON.stringify(TEST_USER),
    });

    if (res.ok) {
      ok(`Test user created (${TEST_USER.email} / ${TEST_USER.password})`);
    } else if (res.status === 409 || res.status === 422) {
      ok(`Test user already exists (${TEST_USER.email} / ${TEST_USER.password})`);
    } else {
      const body = await res.text();
      fail(`Failed to create test user: ${res.status} ${body}`);
    }
  } catch (err) {
    fail(`Failed to create test user: ${String(err)}`);
  }
}

function startFrontend(): ChildProcess {
  info("Starting frontend dev server…");
  const vpBin = resolve(ROOT, "node_modules/.bin/vp");
  const appPort = new URL(APP_URL).port || "5173";
  const child = spawnPrefixed("fe", vpBin, ["run", `frontend#dev`, "--", "--port", appPort], {
    env: { VITE_API_URL: API_URL },
  });
  return child;
}

async function waitForFrontend(child: ChildProcess): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < HEALTH_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      fail(`Frontend process exited with code ${child.exitCode}`);
      process.exit(1);
    }
    try {
      const res = await fetch(APP_URL);
      if (res.ok) {
        ok(`Frontend running → ${CYAN}${APP_URL}${RESET}`);
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(HEALTH_POLL_MS);
  }
  fail("Frontend did not become ready in time");
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──

async function main() {
  banner("GMDSS QA Setup");

  checkPrerequisites();
  startDocker();
  await waitForHealth();
  runMigrations();
  seedDatabase();

  const api = startApi();
  await waitForApi(api);
  await createTestUser();

  const fe = startFrontend();
  await waitForFrontend(fe);

  banner("Ready");
  console.log(
    `  ${BOLD}Login:${RESET} ${YELLOW}${TEST_USER.email}${RESET} / ${YELLOW}${TEST_USER.password}${RESET}`,
  );
  console.log(`  ${BOLD}App:${RESET}   ${CYAN}${APP_URL}${RESET}`);
  console.log(`  ${BOLD}API:${RESET}   ${CYAN}${API_URL}${RESET}`);
  console.log(`\n  ${DIM}Press Ctrl+C to stop all services${RESET}\n`);

  // Keep alive until Ctrl+C
  await new Promise<void>((resolve) => {
    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n${DIM}Shutting down…${RESET}`);
      killAll();
      killPort(API_PORT);
      try {
        run(`${COMPOSE} -f ${DOCKER_COMPOSE} stop`, { silent: true });
      } catch {
        // best effort
      }
      ok("All services stopped");
      resolve();
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    api.on("exit", (code: number | null) => {
      if (code !== null && code !== 0) {
        fail(`API process exited with code ${code}`);
        shutdown();
      }
    });
  });
}

main().catch((err) => {
  fail(`Setup failed: ${err}`);
  killAll();
  killPort(API_PORT);
  try {
    run(`${COMPOSE} -f ${DOCKER_COMPOSE} stop`, { silent: true });
  } catch {
    // best effort
  }
  process.exit(1);
});
