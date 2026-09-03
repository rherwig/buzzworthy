/**
 * Barrel for the framework-agnostic game core (docs/JEOPARDY.md §6).
 *
 * Import from `~~/shared/game` — the reducer (`state.ts`), the read-only queries
 * (`selectors.ts`) and the state types are all re-exported here.
 */
export * from './types'
export * from './state'
export * from './selectors'
