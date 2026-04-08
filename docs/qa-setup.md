# QA Setup Script

One command to start the full GMDSS Simulator stack locally.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), or [Podman](https://podman.io/) with `podman-compose`
- [Vite+](https://viteplus.dev) (`curl -fsSL https://vite.plus | bash`)
- Dependencies installed: `vp install`

## Usage

```bash
vp run qa
```

Stop everything with **Ctrl+C**.

If your terminal says `command not found: vp`, the Vite+ shell integration isn't loaded. Either open a new terminal or run:

```bash
source ~/.vite-plus/env
```

Do **not** use `npx vp run qa` — npx uses the system Node (likely 22) which cannot run TypeScript. The global `vp` provides its managed Node 24.

## What it does

| Step | Action                                                                                      |
| ---- | ------------------------------------------------------------------------------------------- |
| 1    | Creates `.env` from `.env.example` if missing, loads it. Checks prerequisites (Docker, vp). |
| 2    | Starts PostgreSQL 16 and Redis 7 via Docker Compose.                                        |
| 3    | Waits for both services to be healthy (up to 30 s).                                         |
| 4    | Runs Drizzle database migrations.                                                           |
| 5    | Seeds the database: 4 modules, 28 lessons, 4 quizzes, 5 jurisdictions.                      |
| 6    | Starts the API server on `http://localhost:3001`.                                           |
| 7    | Creates a test user account via the API.                                                    |
| 8    | Starts the frontend dev server on `http://localhost:5173`.                                  |

On **Ctrl+C**, it kills the API and frontend processes and stops Docker containers.

## Test credentials

| Field    | Value              |
| -------- | ------------------ |
| Email    | `test@gmdss.local` |
| Password | `testpass123`      |

## Ports

| Service         | Port |
| --------------- | ---- |
| Frontend (Vite) | 5173 |
| API (Fastify)   | 3001 |
| PostgreSQL      | 5432 |
| Redis           | 6379 |

## Environment variables

The script reads from `.env` in the project root (auto-copied from `.env.example` on first run). Key variables:

```dotenv
DATABASE_URL=postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=dev-secret-change-in-production-at-least-32-chars
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

## Re-running

The script is idempotent. Running it again will:

- Reuse existing Docker containers (no data loss).
- Skip migrations that have already been applied.
- Skip seed data that already exists (uses `ON CONFLICT DO NOTHING`).
- Skip test user creation if the account already exists.

## Troubleshooting

**`command not found: vp`** — Run `source ~/.vite-plus/env` or open a new terminal. The Vite+ installer adds this to `~/.zshrc` but existing sessions need a reload.

**`ERR_UNKNOWN_FILE_EXTENSION .ts`** — You ran via `npx` or system Node. Use `vp run qa` (global vp), which provides Node 24 with native TypeScript support.

**Docker not running** — Start Docker Desktop before running the script.

**Port already in use** — Another process is using 3001 or 5173. Stop it or change the port in `.env`.

**Database connection refused** — PostgreSQL may still be starting. The script waits up to 30 s; if it times out, check `docker compose -f docker-compose.dev.yml logs postgres`.

**Stale database** — To reset everything:

```bash
docker compose -f docker-compose.dev.yml down -v
vp run qa
```
