# Searching for meaning

An image-archive search app — Next.js monolith over Postgres + Meilisearch, with Sequin as the Postgres → Meilisearch CDC bridge.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind v4 |
| Icons | lucide-react |
| Database | Postgres 16 (logical replication enabled) |
| Search | Meilisearch v1.11 |
| CDC | Sequin (Postgres WAL → Meilisearch sink) |
| Package manager | pnpm 11 |

## Prerequisites

- Node.js 20+
- pnpm 11+ (`brew install pnpm`)
- Docker Desktop

## Local setup

```bash
# Install JS dependencies
pnpm install

# Start Postgres, Meilisearch, Sequin, Redis
docker compose up -d

# Run Next.js
pnpm dev
```

App: <http://localhost:3000>

## Endpoints

| URL | What it is |
|---|---|
| <http://localhost:3000> | Home page |
| <http://localhost:3000/api/health> | JSON health check (Postgres + Meilisearch). Returns `200` if both up, `503` otherwise. |

## Services

| Service | URL | Notes |
|---|---|---|
| Next.js | <http://localhost:3000> | `pnpm dev` |
| Postgres | `postgres://postgres:postgres@localhost:5432/searching_for_meaning` | App DB, `wal_level=logical` |
| Meilisearch | <http://localhost:7700> | Master key in `.env.local` |
| Sequin | <http://localhost:7376> | Web UI for configuring CDC sinks |
| Redis | (internal) | Sequin's queue |
| sequin-pg | (internal) | Sequin's state DB |

Stop everything: `docker compose down`
Wipe data: `docker compose down -v`

## Env

Copy and adjust:

```bash
cp .env.example .env.local
```

`MEILI_MASTER_KEY` is shared between the compose file and `.env.local` — rotate before any non-local deploy.

## Project layout

```
app/
  api/health/route.ts    # health endpoint
  layout.tsx             # root layout, loads globals.css + Geist fonts
  page.tsx               # home page
  globals.css            # Tailwind entry + theme tokens
  icon.svg               # favicon (globe)
lib/
  db/client.ts           # pg Pool singleton (HMR-safe)
  search/meili-client.ts # Meilisearch client singleton
docker-compose.yml       # full local infra
pnpm-workspace.yaml      # pnpm 11 native-build approvals
```

## Useful commands

| | |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `docker compose up -d` | Start all backing services |
| `docker compose ps` | Show service status |
| `docker compose logs -f sequin` | Tail Sequin logs |
| `curl localhost:3000/api/health` | Verify everything is wired up |
