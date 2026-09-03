# AI Boilerplate

A modular, enterprise-ready **Nuxt 3 + TypeScript** web-project template, designed to be
safe for AI agents to maintain. See [`docs/STACK.md`](docs/STACK.md) for the full decision
record and [`AGENTS.md`](AGENTS.md) for agent/contributor guidance.

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

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up env + database (SQLite by default)
cp .env.example .env
pnpm db:migrate     # create/apply migrations
pnpm db:seed        # load the sample Jeopardy boards

# 3. Run the dev server
pnpm dev            # http://localhost:3000
```

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
server/utils/    Server-only utils (Prisma client, Zod env) — auto-imported
shared/          Types/schemas shared between client and server
stores/          Pinia stores
prisma/          Prisma schema, migrations + seed
tests/unit/      Vitest unit/component tests
tests/e2e/       Playwright e2e tests
```

## Code style

Prettier is configured with: **no semicolons**, **single quotes**, **trailing commas
everywhere**, and **4-space indentation** (see [`.prettierrc.json`](.prettierrc.json)).
ESLint (flat config) integrates with Prettier via `eslint-config-prettier`.
