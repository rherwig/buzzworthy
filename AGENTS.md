# AGENTS.md — Guidance for AI agents & contributors

This repository is a **Vue 3 / TypeScript web-project template** designed to be
**modular, enterprise-ready, and safe for AI agents to maintain**.

**Read [`docs/STACK.md`](docs/STACK.md) first.** It is the source of truth for every
technology choice and the reasoning behind it. Do not introduce alternative tools that
contradict it without explicitly proposing a change to that document.

**Building UI components?** Read [`docs/COMPONENTS.md`](docs/COMPONENTS.md) — it defines the
required structure and workflow for the shared UI library (`shared/ui`).

## The stack (short form)

- **Framework:** Nuxt 3 (SSR/SSG, file-based routing, auto-imports)
- **Language:** TypeScript, `strict` mode — no `any`
- **Backend:** Nuxt Nitro server routes (`server/`)
- **Database:** Prisma ORM — SQLite in dev, PostgreSQL in prod (keep schema portable)
- **Styling:** Tailwind CSS + Headless UI (no component library); variants via CVA (`class-variance-authority`)
- **UI library:** own presentational primitives in `shared/ui`, styled with Tailwind + CVA (see `docs/COMPONENTS.md`)
- **Component workshop:** Storybook (run standalone via `pnpm storybook`)
- **State:** Pinia (`@pinia/nuxt`) for shared client state; use composables/`useState` for trivial local state
- **Validation:** Zod at every external boundary (HTTP input, env vars, forms)
- **Tests:** Vitest (unit/component) + Playwright (e2e)
- **Quality:** ESLint (flat config) + Prettier, Husky + lint-staged
- **Package manager:** pnpm (always use `pnpm`, never `npm`/`yarn`)

## Working rules for agents

1. **Respect the stack.** Match existing patterns and Nuxt conventions
   (`pages/`, `components/`, `composables/`, `server/`, `layouts/`, `middleware/`).
2. **Design principles:** apply SOLID, DRY, KISS. Small, single-responsibility modules;
   keep domain/business logic out of Vue components (use composables / server utils).
3. **Type-safety first.** Share types between client and Nitro server. Avoid `any` and
   non-null assertions; rely on inference and Zod-derived types.
4. **Validate boundaries.** Any external/untyped data must pass a Zod schema.
5. **Tests are required** for non-trivial logic: Vitest for units/components, Playwright
   for critical flows. Never weaken/skip tests to make them pass.
6. **Before committing**, ensure lint, typecheck, and tests pass (hooks enforce this).
   Formatting is owned by Prettier: no semicolons, single quotes, trailing commas
   everywhere, 4-space indentation. Run `pnpm format` / `pnpm lint:fix` — never hand-format.
7. **Document decisions.** When you add/replace a technology or make a notable
   architectural choice, update [`docs/STACK.md`](docs/STACK.md) so future agents stay aligned.

## Explicitly deferred (do not assume these are missing by mistake)

GitHub Actions CI · Docker/docker-compose · Conventional Commits + commitlint.
These were considered and left out of the base template on purpose. Add them per-project
when there's a concrete need, and record the decision in `docs/STACK.md`.
