/**
 * Barrel for the framework-agnostic game core (docs/JEOPARDY.md §6).
 *
 * Import from `~~/shared/game` — the reducer (`state.ts`), the read-only queries
 * (`selectors.ts`), the state types, and the online-room contracts (`room.ts`,
 * `messages.ts`, `clock.ts`) are all re-exported here.
 */
export * from './types'
export * from './state'
export * from './selectors'
export * from './clock'
export * from './room'
export * from './messages'
