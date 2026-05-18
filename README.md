# Searching for meaning

An image-archive search app — Next.js monolith over Postgres + Meilisearch, with Sequin as the (planned) Postgres → Meilisearch CDC bridge.

## Stack

| Layer            | Choice                                    |
| ---------------- | ----------------------------------------- |
| App              | Next.js 16 (App Router, Turbopack)        |
| Language         | TypeScript                                |
| Styling          | Tailwind v4                               |
| Icons            | lucide-react                              |
| Database         | Postgres 16 (logical replication enabled) |
| ORM / migrations | Drizzle ORM + drizzle-kit                 |
| Search           | Meilisearch v1.11                         |
| Test runner      | Vitest                                    |
| Fake data        | @faker-js/faker (German locale)           |
| CDC              | Sequin _(not wired up yet)_               |
| Package manager  | pnpm 11                                   |

## Prerequisites

- Node.js 20+
- pnpm 11+ (`brew install pnpm`)
- Docker Desktop

## Local setup

```bash
pnpm install                # install JS dependencies
docker compose up -d        # start Postgres, Meilisearch, Sequin, Redis
pnpm db:migrate             # apply schema migrations
pnpm db:seed                # insert the 15-row starter dataset
pnpm meili:setup            # create + configure the search index
pnpm meili:reindex          # push Postgres rows → Meilisearch
pnpm dev                    # start Next.js
```

App: <http://localhost:3000>

## Pages

| URL                                  | What it is                                                                |
| ------------------------------------ | ------------------------------------------------------------------------- |
| <http://localhost:3000>              | **Search** — landing page (form posts back to `/`)                        |
| <http://localhost:3000/admin/seed>   | Form that generates N random images and inserts them                      |
| <http://localhost:3000/admin/images> | Latest 50 rows from Postgres (no search engine involved)                  |
| <http://localhost:3000/api/health>   | JSON health check. `200` if Postgres + Meilisearch both up, `503` if not. |

The global header (`Searching for meaning` wordmark) is the home link. Each page has its own H1 below it.

## Data model

```
agencies        (id, name UNIQUE)
photographers   (id, name, agency_id → agencies.id)
                UNIQUE NULLS NOT DISTINCT (agency_id, name)
images          (bildnummer PK, suchtext, photographer_id → photographers.id,
                 datum, width, height, allowed_territories[], denied_territories[],
                 created_at, updated_at)
images_search   VIEW — denormalized read model that Sequin will watch
                  (bildnummer, suchtext, fotografen, agency,
                   datum_ts, width, height, orientation,
                   allowed_territories, denied_territories, updated_ts)
```

- `agencies` is a first-class entity so multi-source ingest (IMAGO + dpa + AP + …) works without schema changes. Solo photographers have `agency_id = NULL`.
- `images_search` is the document shape Meilisearch indexes (and the shape Sequin will push in M4).

## Ingest pipeline

Every raw record flows through `lib/ingest/ingestImages.ts` → preprocessing in `lib/ingest/parse.ts`:

| Raw input                         | Becomes                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `"IMAGO / teutopress"`            | `agencies.name = "IMAGO"`, `photographers.name = "teutopress"`  |
| `"01.11.1995"`                    | `Date(1995-11-01)`                                              |
| `PUBLICATIONxINxGERxSUIxAUTxONLY` | `allowed_territories = ['DE','CH','AT']`, stripped from caption |
| `PUBLICATIONxNOTxINxUSA`          | `denied_territories = ['US']`, stripped from caption            |
| `NOxSALExINxJPN`                  | `denied_territories += ['JP']`, stripped from caption           |
| `UnitedArchives00421716`          | dropped (internal noise)                                        |
| `"  multiple   spaces  "`         | collapsed                                                       |

The same `ingestRawImages()` is used by both the CLI seeder (`scripts/seed.ts`) and the admin Server Action (`app/admin/seed/page.tsx`).

## Search architecture

```
Browser  ──► Next.js Server Component  ──►  imageSearch.search({...})
                                                   │
                                                   ▼
                                       MeilisearchImageSearch (adapter)
                                                   │
                                                   ▼
                                            Meilisearch HTTP
```

- `lib/search/types.ts` — `ImageSearch` interface. Domain-shaped: `SearchRequest`, `ImageFilters`, `DateFilter`, `SortMode`, `ImageHit`, `Facets`. No engine concepts leak in.
- `lib/search/meilisearch-adapter.ts` — the only file that knows about Meili's filter strings, `_formatted` highlights, epoch-second dates, etc.
- `lib/search/index.ts` — factory exporting the singleton `imageSearch`.

Swapping engines = write one new adapter that implements `ImageSearch`.

### Indexing

After Sequin is wired up (see next section), inserts and deletes in Postgres show up in Meilisearch within ~1 second automatically. The reindex script remains as a manual rebuild/disaster-recovery tool.

| Trigger                            | Run                                                           |
| ---------------------------------- | ------------------------------------------------------------- |
| Edited `scripts/meili-setup.ts`    | `pnpm meili:setup`                                            |
| Changed `images_search` view shape | `pnpm db:migrate` → `pnpm meili:setup` → `pnpm meili:reindex` |
| Wiped Meili volume                 | `pnpm meili:setup` → `pnpm meili:reindex`                     |
| Sequin sink down for a while       | `pnpm meili:reindex` to catch up                              |

## Sequin CDC setup

Sequin watches Postgres' WAL and POSTs CDC events to `/api/sequin/sink`. The handler queries `images_search` for the full denormalized doc and upserts/deletes it in Meilisearch.

```
Postgres WAL ─► Sequin ─► POST /api/sequin/sink ─► lookup images_search ─► Meilisearch
```

**One-time setup (Sequin UI at <http://localhost:7376>):**

1. **Open Sequin UI** and create the first admin user when prompted.
2. **Add a database**:
   - Host: `postgres` _(Docker service name — Sequin reaches it on the compose network)_
   - Port: `5432`
   - Database: `searching_for_meaning`
   - User / Password: `postgres` / `postgres`
   - Use SSL: off
   - Click _Test connection_ → _Create_.
   - When prompted, let Sequin create the publication and replication slot.
3. **Add an HTTP push sink**:
   - Source: the `images` table on the database above
   - Destination URL: `http://host.docker.internal:3000/api/sequin/sink`
     _(macOS / Windows Docker. On Linux, find your host IP or run Next.js inside the compose network.)_
   - Header: `Authorization: Bearer dev-sequin-secret-change-me`
     _(must match `SEQUIN_WEBHOOK_SECRET` in `.env.local`)_
   - Batch size: 10–100 is fine for local
   - Enable _Backfill on creation_ to push the existing rows immediately
4. **Verify**: insert a row via `/admin/seed` → check `/admin/images` → search for any caption term on `/`. The row should be searchable within ~1s with no manual reindex.

**Notes / gotchas:**

- The sink watches the `images` table — not the `images_search` view (Postgres logical replication doesn't work on views). The webhook re-joins photographer + agency at lookup time.
- A photographer or agency rename does **not** propagate to existing image docs until those images are themselves updated. Acceptable for now; run `pnpm meili:reindex` for a full refresh if it matters.
- Sequin secret currently lives in `.env.local`. Rotate with `openssl rand -hex 32` before any non-local deploy.

## Services

| Service     | URL                                                                 | Notes                            |
| ----------- | ------------------------------------------------------------------- | -------------------------------- |
| Next.js     | <http://localhost:3000>                                             | `pnpm dev`                       |
| Postgres    | `postgres://postgres:postgres@localhost:5432/searching_for_meaning` | App DB, `wal_level=logical`      |
| Meilisearch | <http://localhost:7700>                                             | Master key in `.env.local`       |
| Sequin      | <http://localhost:7376>                                             | Web UI for configuring CDC sinks |
| Redis       | (internal)                                                          | Sequin's queue                   |
| sequin-pg   | (internal)                                                          | Sequin's state DB                |

Stop everything: `docker compose down`
Wipe data: `docker compose down -v`

## Env

```bash
cp .env.example .env.local
```

`MEILI_MASTER_KEY` is shared between the compose file and `.env.local` — rotate before any non-local deploy.

## Project layout

```
app/
  layout.tsx                    # root layout: nav + "Searching for meaning" wordmark
  page.tsx                      # home = Search (Server Component)
  globals.css                   # Tailwind entry + theme tokens
  icon.svg                      # favicon (globe)
  api/health/route.ts           # health endpoint
  admin/
    layout.tsx                  # admin shell
    seed/page.tsx               # Server Action: generate N rows
    images/page.tsx             # list latest 50 rows (Postgres only)
lib/
  db/
    client.ts                   # pg Pool singleton (HMR-safe)
    db.ts                       # Drizzle wrapped around the Pool
    schema.ts                   # tables + inferred TS types
  fake/
    generateImage.ts            # faker-based random IMAGO record
    starterDataset.ts           # 15 hand-curated rows (incl. brief's 2 examples)
  ingest/
    parse.ts                    # parsers: territories, dates, photographer, suchtext
    parse.test.ts               # 33 Vitest cases
    ingestImages.ts             # shared ingest pipeline used by both seeders
  search/
    types.ts                    # ImageSearch interface + domain types
    meilisearch-adapter.ts      # Meilisearch implementation
    meili-client.ts             # Meilisearch JS client singleton
    index.ts                    # factory exporting `imageSearch`
scripts/
  seed.ts                       # CLI seeder
  meili-setup.ts                # configure the images index (idempotent)
  reindex.ts                    # cursor-paginate Postgres → Meilisearch
drizzle/
  0000_init.sql                 # photographers + images tables
  0001_images_search_view.sql   # denormalized read model
  0002_agencies.sql             # agencies table + photographers FK
  meta/_journal.json
drizzle.config.ts
docker-compose.yml              # full local infra
pnpm-workspace.yaml             # pnpm 11 native-build approvals
```

## Useful commands

|                                  |                                          |
| -------------------------------- | ---------------------------------------- |
| `pnpm dev`                       | Start Next.js dev server                 |
| `pnpm build`                     | Production build                         |
| `pnpm lint`                      | ESLint                                   |
| `pnpm test`                      | Run Vitest once                          |
| `pnpm test:watch`                | Re-run tests on file change              |
| `pnpm db:generate`               | Diff schema → new migration file         |
| `pnpm db:migrate`                | Apply pending migrations                 |
| `pnpm db:seed`                   | Insert starter dataset (15 rows)         |
| `pnpm db:seed 500`               | Starter + 500 random rows                |
| `pnpm db:seed --random 500`      | 500 random rows only                     |
| `pnpm meili:setup`               | Create/update Meilisearch index settings |
| `pnpm meili:reindex`             | Push Postgres rows → Meilisearch         |
| `docker compose up -d`           | Start all backing services               |
| `docker compose ps`              | Show service status                      |
| `docker compose logs -f sequin`  | Tail Sequin logs                         |
| `curl localhost:3000/api/health` | Verify everything is wired up            |

## Wipe and reseed

```bash
docker exec sfm-postgres psql -U postgres -d searching_for_meaning \
  -c "TRUNCATE TABLE images, photographers, agencies RESTART IDENTITY CASCADE;"
pnpm db:seed
pnpm meili:reindex
```

To wipe Meilisearch too:

```bash
docker compose down -v
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm meili:setup
pnpm meili:reindex
```
