# Component development guide

> Status: **Accepted** · Last updated: 2026-08-28
>
> How to build UI components in this template. Read this before adding or changing
> anything under [`shared/ui`](../shared/ui). It complements [`STACK.md`](./STACK.md)
> (the source of truth for _which_ tools we use) by describing _how_ we use them.

## The shared UI library (`shared/ui`)

Reusable, presentational components live in [`shared/ui`](../shared/ui) — **not** in
`components/`. Use them as the project's design-system primitives.

- `components/` — app-specific, feature-bound components (may use Pinia stores, fetch
  data, know about routes).
- `shared/ui/` — generic, reusable, **presentational** primitives (button, input, modal,
  …). No business logic, no store access, no data fetching. Driven purely by props/slots
  and emit events back out.

### Importing components

Components are exported from a single barrel with a `Ui` prefix and consumed via the
Nuxt `~` alias (which points at the project root):

```ts
import { UiButton } from '~/shared/ui'
```

Do **not** deep-import (`~/shared/ui/button/button.vue`) — always go through the barrel.

## Anatomy of a component

Every component lives in its own folder under `shared/ui/<name>/` and is made of these
files (using `button` as the reference example):

| File                  | Required? | Responsibility                                          |
| --------------------- | --------- | ------------------------------------------------------- |
| `<name>.vue`          | Always    | Markup + behaviour only. Thin; no styling logic inline. |
| `<name>.types.ts`     | Always    | `Props`, `Emits`, and any exported types/unions.        |
| `<name>.constants.ts` | If needed | The `cva` recipe and any other constants.               |
| `<name>.test.ts`      | Always    | Vitest + `@vue/test-utils` unit/component tests.        |
| `<name>.stories.ts`   | Always    | Storybook stories covering the variants.                |

Then re-export the component from [`shared/ui/index.ts`](../shared/ui/index.ts) with a
`Ui` prefix.

### Requirements checklist

When adding a component, all of the following must hold:

1. **Folder + files.** Create `shared/ui/<name>/` with `<name>.vue`,
   `<name>.types.ts`, `<name>.test.ts`, `<name>.stories.ts`, and — only if constants are
   needed — `<name>.constants.ts`.
2. **Types first.** Declare `Props`/`Emits` in `<name>.types.ts`. No `any`, no non-null
   assertions. Prefer deriving types (e.g. variant unions from the `cva` recipe with
   `VariantProps`) so there is a single source of truth.
3. **Styling with Tailwind + CVA.** Express variants with
   [`class-variance-authority`](https://cva.style) in `<name>.constants.ts`. Use the
   semantic Tailwind tokens (`primary`, `surface`, `border`, `foreground`, `muted`, …)
   defined in [`tailwind.config.ts`](../tailwind.config.ts) — never hard-coded colors.
4. **Keep the `.vue` thin.** No business logic, no store/`useFetch` calls. Compute the
   class string from the `cva` recipe and render slots.
5. **Unit tests (Vitest).** Cover rendering, default + explicit variants/sizes, and every
   emitted event (including the "disabled does not emit" case). Tests are co-located as
   `<name>.test.ts`.
6. **A story per component.** Add `<name>.stories.ts` with an `autodocs`-tagged `meta`
   and one story per meaningful variant/state.
7. **Export from the barrel.** Add `export { default as Ui<Name> } from './<name>/<name>.vue'`
   to `shared/ui/index.ts`, plus its public types.
8. **Green gates.** `pnpm test`, `pnpm typecheck`, and `pnpm lint` must all pass, and the
   code must be Prettier-formatted (`pnpm format`). Never hand-format.

## Storybook

Storybook runs **standalone** (it is intentionally _not_ registered as a Nuxt module, as
that destabilizes `nuxt dev`/`build`/`typecheck`). Stories still run with full Nuxt
context via the `@storybook-vue/nuxt` framework configured in
[`.storybook/main.ts`](../.storybook/main.ts).

```bash
pnpm storybook        # dev server on http://localhost:6006
pnpm build:storybook  # static build into storybook-static/ (gitignored)
```

Story type imports come from `@storybook/vue3-vite`:

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
```

Tailwind is loaded globally in [`.storybook/preview.ts`](../.storybook/preview.ts) via
`import '../assets/css/tailwind.css'` so stories are styled exactly like the app. Without
this import, utility classes are not generated and components render unstyled.

## Reference example

See [`shared/ui/button`](../shared/ui/button) for a complete, canonical implementation of
all of the above.
