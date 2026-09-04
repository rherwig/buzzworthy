# Buzzworthy

_Answer first. Question later._

A quiz-night game on a category board: local players share one screen, remote players join by
room code and buzz in from their own device. Built on a modular, enterprise-ready
**Nuxt 3 + TypeScript** foundation designed to be safe for AI agents to maintain — see
[`docs/JEOPARDY.md`](docs/JEOPARDY.md) for the product plan, [`docs/STACK.md`](docs/STACK.md)
for the full decision record and [`AGENTS.md`](AGENTS.md) for agent/contributor guidance.

## Stack

| Concern         | Choice                                     |
| --------------- | ------------------------------------------ |
| Meta-framework  | Nuxt 3 (SSR/SSG, Nitro server)             |
| Language        | TypeScript (`strict`)                      |
| ORM / DB        | Prisma — SQLite (dev) → PostgreSQL (prod)  |
| Styling / UI    | Tailwind CSS + Headless UI                 |
| State           | Pinia (`@pinia/nuxt`)                      |
| Validation      | Zod                                        |
| Tests           | Vitest (unit/component) + Playwright (e2e) |
| Lint / format   | ESLint (flat) + Prettier                   |
| Git hooks       | Husky + lint-staged                        |
| Package manager | pnpm                                       |
| Deployment      | Docker image on Fly.io (one machine)       |

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up env + database (SQLite by default)
cp .env.example .env
pnpm db:migrate     # create/apply migrations
pnpm db:seed        # load the sample boards

# 3. Run the dev server
pnpm dev            # http://localhost:3000
```

On the start page, **Host** opens a room for the chosen board and hands out a room code plus a
join link (`/join/<code>`). Each seat is then set to **Local**, **Open** or **Closed** in the
lobby: local seats share the host's screen, open seats are claimed by players on their own
device. An all-local game just never hands out its code.

The colour scheme is picked in the header. Only the schemes listed in `composables/useTheme.ts`
are offered; `assets/css/tailwind.css` holds a few more as a development palette.

## Deployment

```bash
fly deploy -e SEED_ON_BOOT=1     # first deploy: migrate + load the boards
```

One Fly.io machine with SQLite on a mounted volume. It must stay a **single** instance:
live rooms are held in that process's memory and players are attached to it over WebSockets,
which also rules out serverless hosts. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full
walkthrough, `Dockerfile` / `fly.toml` for the configuration.

## Scripts

| Command                             | Description                        |
| ----------------------------------- | ---------------------------------- |
| `pnpm dev`                          | Start the dev server               |
| `pnpm build`                        | Production build                   |
| `pnpm preview`                      | Preview the production build       |
| `pnpm typecheck`                    | Type-check the project (`vue-tsc`) |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint                         |
| `pnpm format` / `pnpm format:check` | Run Prettier                       |
| `pnpm test`                         | Run unit/component tests (Vitest)  |
| `pnpm test:e2e`                     | Run e2e tests (Playwright)         |
| `pnpm db:migrate`                   | Create/apply a Prisma migration    |
| `pnpm db:seed`                      | Seed sample board content          |
| `pnpm db:studio`                    | Open Prisma Studio                 |

## Project structure

```
assets/          Global CSS (Tailwind entrypoint)
components/       Vue components (auto-imported)
composables/     Reusable client logic (auto-imported)
layouts/         Layout components
pages/           File-based routes
server/api/      Nitro API routes
server/routes/   Non-API Nitro routes, incl. the `_ws/room` WebSocket channel
server/utils/    Server-only utils (Prisma client, Zod env, repositories, room registry) — auto-imported
shared/          Types/schemas shared between client and server (TypeScript only)
shared/game/     Pure, framework-agnostic game core: reducer, selectors, room protocol
ui/              Presentational primitives (Tailwind + CVA), see docs/COMPONENTS.md
stores/          Pinia stores
prisma/          Prisma schema, migrations, board content + seed
tests/e2e/       Playwright e2e tests
*.test.ts        Vitest unit/component tests, next to the code they cover
```

## Code style

Prettier is configured with: **no semicolons**, **single quotes**, **trailing commas
everywhere**, and **4-space indentation** (see [`.prettierrc.json`](.prettierrc.json)).
ESLint (flat config) integrates with Prettier via `eslint-config-prettier`.
