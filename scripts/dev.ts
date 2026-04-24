/**
 * Dev orchestrator — runs utils watch + frontend dev in parallel.
 *
 * Usage: vp run dev
 *
 * Starts `vp pack --watch` in packages/utils first, waits for the initial
 * build to complete, then starts the frontend Vite dev server. Prevents
 * the stale-dist class of bug where frontend imports reference exports
 * added to utils source but not yet in dist/.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const VP = resolve(ROOT, "node_modules/.bin/vp");
const UTILS_DIR = resolve(ROOT, "packages/utils");
const FRONTEND_DIR = resolve(ROOT, "apps/frontend");

const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const children: ChildProcess[] = [];

function spawnPrefixed(label: string, args: string[], cwd: string): ChildProcess {
  const child = spawn(VP, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
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

const INITIAL_BUILD_TIMEOUT_MS = 60_000;

function waitForInitialBuild(child: ChildProcess, label: string, timeoutMs: number): Promise<void> {
  return new Promise((resolveWait, rejectWait) => {
    let buffer = "";
    let settled = false;

    const cleanup = () => {
      settled = true;
      child.stdout?.off("data", onData);
      child.off("exit", onExit);
      clearTimeout(timer);
    };
    const onData = (data: Buffer) => {
      if (settled) return;
      buffer += data.toString();
      if (buffer.includes("Build complete")) {
        cleanup();
        resolveWait();
        return;
      }
      // Bound buffer growth; keep the tail so a split marker across chunks still matches.
      if (buffer.length > 8192) buffer = buffer.slice(-1024);
    };
    const onExit = (code: number | null) => {
      if (settled) return;
      cleanup();
      rejectWait(new Error(`${label} exited (code ${code}) before first build`));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      rejectWait(new Error(`${label} did not emit "Build complete" within ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on("data", onData);
    child.once("exit", onExit);
  });
}

let shuttingDown = false;
function shutdown(exitCode = 0): never {
  if (!shuttingDown) {
    shuttingDown = true;
    for (const child of children) {
      if (child.exitCode === null) child.kill("SIGTERM");
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const utils = spawnPrefixed("utils", ["pack", "--watch"], UTILS_DIR);

try {
  await waitForInitialBuild(utils, "utils", INITIAL_BUILD_TIMEOUT_MS);
} catch (err) {
  console.error(`${RED}  ✗${RESET} ${String(err)}`);
  shutdown(1);
}

const fe = spawnPrefixed("fe", ["dev"], FRONTEND_DIR);
fe.once("exit", (code) => {
  // Frontend dev server is the foreground task — if it exits, tear down utils too.
  if (!shuttingDown) shutdown(code ?? 1);
});
