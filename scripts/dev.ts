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

function waitForInitialBuild(child: ChildProcess, label: string): Promise<void> {
  return new Promise((resolveWait, rejectWait) => {
    const onData = (data: Buffer) => {
      if (data.toString().includes("Build complete")) {
        child.stdout?.off("data", onData);
        resolveWait();
      }
    };
    child.stdout?.on("data", onData);
    child.once("exit", (code) => {
      if (code !== 0) rejectWait(new Error(`${label} exited with code ${code} before first build`));
    });
  });
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const utils = spawnPrefixed("utils", ["pack", "--watch"], UTILS_DIR);

try {
  await waitForInitialBuild(utils, "utils");
} catch (err) {
  console.error(`${RED}  ✗${RESET} ${String(err)}`);
  shutdown();
  process.exit(1);
}

spawnPrefixed("fe", ["dev"], FRONTEND_DIR);
