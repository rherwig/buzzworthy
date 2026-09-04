# Tech Stack Decision Record

> Status: **Accepted** · Last updated: 2026-09-04
>
> This document records the technology choices for this Vue/TypeScript web-project
> template and the reasoning behind them. It is the single source of truth for the
> stack. Treat every entry here as a deliberate, agreed decision — not an accident.

## Goals

This is a **template / boilerplate** for future team web projects. It optimizes for:

- **Modularity & maintainability** — clear boundaries, conventional structure.
- **AI-maintainability** — mainstream, well-documented tools that AI agents understand,
  strong static guarantees (types, lint) so automated changes stay safe.
- **Team collaboration** — enterprise-ready code style, automated quality gates.
- **Software design principles** — SOLID, DRY, KISS applied throughout.

## Decisions

| Concern                | Choice                                              | Status   |
| ---------------------- | --------------------------------------------------- | -------- |
| Meta-framework         | **Nuxt 3**                                          | Accepted |
| Language               | **TypeScript** (`strict` mode)                      | Accepted |
| Backend / API          | **Nuxt Nitro server** (`server/` routes)            | Accepted |
| ORM                    | **Prisma**                                          | Accepted |
| Database (dev)         | **SQLite**                                          | Accepted |
| Database (prod)        | **PostgreSQL** (target; swap via Prisma datasource) | Accepted |
| Styling                | **Tailwind CSS**                                    | Accepted |
| Style variants         | **CVA** (`class-variance-authority`)                | Accepted |
| UI primitives          | **Headless UI** + own `shared/ui` library           | Accepted |
| Component workshop     | **Storybook** (standalone, Nuxt-aware framework)    | Accepted |
| State management       | **Pinia**                                           | Accepted |
| Unit / component tests | **Vitest** (+ `@vue/test-utils`)                    | Accepted |
| End-to-end tests       | **Playwright**                                      | Accepted |
| Linter                 | **ESLint** (flat config)                            | Accepted |
| Formatter              | **Prettier**                                        | Accepted |
| Package manager        | **pnpm**                                            | Accepted |
| Runtime validation     | **Zod**                                             | Accepted |
| Git hooks              | **Husky + lint-staged**                             | Accepted |
| DB seed runner         | **tsx** (executes `prisma/seed.ts`)                 | Accepted |
| Realtime transport     | **Nitro WebSockets** (`defineWebSocketHandler`)     | Accepted |

### Deferred / explicitly out of scope (for now)

These were considered and **intentionally not included** in the base template. Future
agents/teams may add them per-project — their absence is a decision, not an oversight.

- **GitHub Actions CI** — quality gates run locally via hooks for now; add CI per project.
- **Docker / docker-compose** — add for prod parity/onboarding when needed.
- **Conventional Commits + commitlint** — add if automated changelog/versioning is wanted.

## Rationale

### Nuxt 3 (over plain Vue + Vite)

- **Pros:** file-based routing, SSR/SSG, auto-imports, and a built-in server layer (Nitro)
  mean less boilerplate and a single, well-known convention AI agents can follow.
- **Cons:** more abstraction/"magic" and opinionated conventions.
- **Why:** the conventions are a _feature_ for a template — they standardize structure and
  reduce per-project bikeshedding.

### Nitro server (over a separate NestJS/Fastify/tRPC service)

- **Pros:** single deploy, shared types between client and server, zero extra infra.
- **Cons:** couples frontend and backend; less ideal if the API must scale independently.
- **Why:** simplest full-stack story for a template; can be extracted later if needed.

### Prisma + SQLite(dev)/PostgreSQL(prod)

- **Pros:** declarative schema, excellent docs and tooling, very AI-friendly, painless
  migrations. SQLite gives zero-infra local dev; Postgres is the production target.
- **Cons:** heavier runtime than Drizzle; be mindful of SQLite↔Postgres feature parity.
- **Note:** keep schema portable; avoid SQLite-only features so the prod swap stays trivial.
- **Seeding:** `prisma/seed.ts` is run by `pnpm db:seed` (wired through `package.json#prisma.seed`).
  Prisma shells out to a plain command, so a TypeScript seed needs a TS runner: **tsx** was
  chosen because it is a single zero-config devDependency, unlike `ts-node`, which needs extra
  ESM configuration in a `"type": "module"` project. It is dev-only and never ships.

### Nitro WebSockets (over Socket.IO or a hosted realtime service)

- **What:** realtime channels are plain Nitro WebSocket handlers in `server/routes/`, enabled
  with `nitro.experimental.websocket`. Messages are validated with Zod schemas that live in
  `shared/`, so client and server are compile-checked against one protocol.
- **Pros:** no extra dependency, no extra service to deploy, and the same shared-types story as
  the rest of the Nitro layer. Built on crossws, so it works across the supported presets.
- **Cons:** the flag is still marked experimental, there is no built-in reconnect/fallback
  (clients handle that themselves), and in-memory channel state does not survive a restart or
  scale across instances — keep such state behind a seam (see `server/utils/rooms.ts`) so it can
  move to Redis later.
- **Why:** matches the "single deploy, shared types" reasoning behind choosing Nitro at all;
  Socket.IO would add a client bundle and a protocol the framework does not know about.

### Tailwind + Headless UI (no component library)

- **Pros:** unstyled, accessible primitives + full control over the design system; no
  lock-in to a component library's look.
- **Cons:** you build/maintain the design system yourself.

### CVA + own UI library (`shared/ui`)

- **What:** presentational primitives live in `shared/ui` (not `components/`), styled with
  Tailwind and [CVA](https://cva.style) for type-safe, declarative variant recipes.
- **Pros:** keeps the design system in one place, prevents `class` string sprawl, and
  derives prop types from the variant recipe (single source of truth). Consumed via a
  `Ui`-prefixed barrel: `import { UiButton } from '~/shared/ui'`.
- **See:** [`COMPONENTS.md`](./COMPONENTS.md) for the required structure and workflow.

### Storybook (component workshop)

- **What:** isolated development/documentation of `shared/ui` components.
- **How:** run **standalone** via `pnpm storybook` using the `@storybook-vue/nuxt`
  framework, which gives stories full Nuxt context. It is deliberately **not** registered
  as a Nuxt module — doing so bundles Nitro during `nuxt dev`/`build`/`typecheck` and
  destabilizes those core commands.
- **Cons:** an extra toolchain and build; acceptable for the design-system payoff.

### Vitest + Playwright

- **Vitest:** Vite-native, fast, Jest-compatible API, first-class Vue support — the natural
  fit for a Nuxt/Vite stack.
- **Playwright:** modern, reliable cross-browser e2e with great tracing and parallelism.

### Pinia (state management)

- **Pros:** official Vue/Nuxt state library, TypeScript-first with excellent inference,
  modular stores (fits SOLID/DRY), first-class DevTools, and `@pinia/nuxt` gives
  auto-imported stores and SSR-safe state out of the box.
- **Cons:** an extra dependency; overkill for purely local component state.
- **Why:** a predictable, conventional home for shared client state so teams and AI agents
  don't invent ad-hoc patterns. Prefer composables/`useState` for trivial state; reach for
  Pinia when state is shared across components/pages.

### ESLint (flat) + Prettier

- Industry standard with the richest Vue/Nuxt plugin ecosystem; both AI and humans know it.
- Keep the two in sync (`eslint-config-prettier`) so formatting and linting don't fight.
- **Prettier config** (`.prettierrc.json`) is the agreed team style: **no semicolons**,
  **single quotes**, **trailing commas everywhere** (`"all"`), and **4-space indentation**
  (`tabWidth: 4`), `printWidth: 100`. Nuxt ESLint stylistic rules are disabled so Prettier
  owns all formatting.

### pnpm

- Fast, disk-efficient, strict dependency isolation — the modern best-practice default.

### Zod

- De-facto TS validation standard; use it for API input, form, and **env var** validation.

### TypeScript strict + Husky/lint-staged

- `strict` maximizes type-safety (the strongest guardrail for AI-generated code).
- Pre-commit hooks run ESLint/Prettier/relevant tests on staged files to keep `main` clean.

## Conventions (to be enforced as the template is built out)

- **Design principles:** SOLID, DRY, KISS. Prefer small, single-responsibility modules.
- **Structure:** follow Nuxt conventions (`pages/`, `components/`, `composables/`,
  `server/`, `layouts/`, `middleware/`). Keep domain logic out of components.
- **Types first:** no `any`; share types between client and Nitro server.
- **Validation at boundaries:** validate all external input (HTTP, env, forms) with Zod.
- **Tests:** Vitest for units/components, Playwright for critical user flows.
- **Test location:** co-locate unit/component tests next to the code they cover
  (e.g. `stores/game.test.ts` beside `stores/game.ts`). Playwright e2e specs stay
  in `tests/e2e/` since they exercise whole flows, not a single module.
