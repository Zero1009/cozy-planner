# 🗓️ Cozy Planner

A cozy, bilingual (ไทย / English) **calendar + to-do planner** with an AI
assistant. Built as a real app from the "Calendar TODO App" design mockup.

- **Dashboard** — greeting, daily stats (tasks today, completion %, upcoming events), today's agenda, and what's coming up.
- **Calendar** — month / week / day views, add events with categories, a time picker, and a per-day agenda.
- **To-Do** — quick add, categories, priority, and All / Today / Upcoming / Completed filters.
- **AI Assistant** — a warm, concise helper that can summarize your tasks and tell you what's on today (powered by Groq).
- Light/dark mode, three accent themes (amber / sky / berry), responsive (desktop sidebar / mobile bottom nav).

## Tech stack

| Concern      | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | **Next.js 15** (App Router, React 19, TypeScript)  |
| Data fetching| **TanStack Query**                                 |
| Validation   | **Zod** (shared client/server schemas)             |
| Database     | **SQLite via Turso (libSQL)** + **Drizzle ORM**    |
| AI           | **Groq** (OpenAI-compatible API)                   |
| Hosting      | **Vercel**                                         |

### Why Turso instead of a plain SQLite file?

Vercel's serverless filesystem is **ephemeral** — a local `*.db` file would be
wiped between invocations and can't be written to reliably. Turso is
SQLite-compatible (libSQL) but hosted over HTTPS, so it behaves like the SQLite
you asked for while actually persisting on serverless. Locally, the app falls
back to a `file:local.db` SQLite file with zero setup.

## Architecture

```
src/
  app/
    layout.tsx          # fonts (Fredoka/Quicksand) + Providers
    providers.tsx       # TanStack Query + preferences (lang/theme/dark) context
    page.tsx            # renders <AppShell/>
    globals.css
    api/
      todos/route.ts        todos/[id]/route.ts     # REST for todos
      events/route.ts       events/[id]/route.ts    # REST for events
      ai/route.ts           # chat → Groq, grounded in your live data
  components/           # AppShell, Dashboard, CalendarView, TodoView, AiPanel
  hooks/                # useTodos, useEvents, useIsDesktop (TanStack Query)
  db/
    schema.ts           # Drizzle tables (todos, events)
    client.ts           # libSQL/Drizzle client (Turso in prod, file locally)
    migrate.ts  seed.ts
  lib/
    theme.ts  i18n.ts  dates.ts  types.ts  validators.ts  api.ts
drizzle/                # generated SQL migrations
```

**Layering:** Zod schemas at the API boundary are the single source of truth for
input shape; Drizzle owns persistence; TanStack Query owns client cache +
optimistic updates. UI preferences (language, theme, dark mode) live in
`localStorage`, not the database.

> **Data model note:** this is a single shared workspace (no auth) — appropriate
> for a small trusted group. The schema and query layer are structured so a
> `userId`/owner column and auth can be layered on later without reshaping the
> app.

## Local development

```bash
# 1. Install
npm install

# 2. Environment (local defaults work out of the box)
cp .env.example .env        # TURSO_DATABASE_URL defaults to file:local.db

# 3. Create the schema + seed sample data into local.db
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev                 # http://localhost:3000
```

To try the AI assistant locally, add a `GROQ_API_KEY` to `.env`
(get one at https://console.groq.com/keys). Without it, the app runs fine and
the assistant returns a friendly "can't connect" message.

## Scripts

| Script                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Dev server                                     |
| `npm run build`       | Production build                               |
| `npm run typecheck`   | `tsc --noEmit`                                 |
| `npm run db:generate` | Regenerate SQL migrations from `schema.ts`     |
| `npm run db:migrate`  | Apply migrations to the target DB              |
| `npm run db:seed`     | Reset + seed sample todos/events (dev only)    |

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request to `main` (and on pushes
to `main`): it installs with `npm ci`, then runs `npm run typecheck` and
`npm run build`. The build touches neither the database nor the AI provider
(route handlers are dynamic and not executed at build time), so **no secrets are
needed in CI**.

## Deploy to Vercel

### 1. Provision the database (Turso)

Run the helper once — it creates the DB, prints the credentials, applies the
schema, and can seed sample data:

```bash
./scripts/setup-turso.sh            # needs the Turso CLI + `turso auth login`
```

<details><summary>…or do it by hand</summary>

```bash
turso db create cozy-planner
turso db show cozy-planner --url          # → TURSO_DATABASE_URL
turso db tokens create cozy-planner       # → TURSO_AUTH_TOKEN
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:seed   # optional
```
</details>

### 2. Get a Groq key

Create one at https://console.groq.com/keys → `GROQ_API_KEY`.

### 3. Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZero1009%2Fcozy-planner&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,GROQ_API_KEY,GROQ_MODEL&envDescription=Turso%20DB%20URL%2Ftoken%20and%20Groq%20API%20key)

Or import the repo manually (New Project → import `Zero1009/cozy-planner`). Set
these Environment Variables for **Production + Preview**:

| Variable              | Value                                      |
| --------------------- | ------------------------------------------ |
| `TURSO_DATABASE_URL`  | `libsql://your-db.turso.io`                |
| `TURSO_AUTH_TOKEN`    | your Turso token                           |
| `GROQ_API_KEY`        | your Groq key                              |
| `GROQ_MODEL`          | `openai/gpt-oss-120b` (or any Groq model)  |

The default build command (`next build`) is all Vercel needs — migrations were
applied in step 1, so no DB credentials are required at build time. Once the
GitHub repo is connected, every push builds a Preview and merges to the
production branch deploy automatically.

> **Note:** the schema lives in Turso, so run `npm run db:migrate` against your
> Turso URL whenever you change `src/db/schema.ts` (regenerate first with
> `npm run db:generate`).

## License

Private project.
