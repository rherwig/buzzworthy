import type { Game } from '../types/game'

/**
 * Live game state types.
 *
 * These describe a game *in progress*; nothing here is persisted (docs/JEOPARDY.md §5).
 * The reducer in `state.ts` is the only place allowed to produce a new `GameState`,
 * so every field is `readonly`.
 */

/** How a lobby seat is filled. */
export type SeatKind = 'local' | 'open' | 'closed'

/** One seat in the lobby / one player or team in the game. */
export interface Seat {
    /** Stable position in the lobby, `0`-based. */
    readonly index: number
    readonly kind: SeatKind
    /** Display name; `null` until the host names a local seat or a player claims an open one. */
    readonly name: string | null
    /** Anonymous id of the remote occupant of an `open` seat (M3). */
    readonly occupantId: string | null
    readonly score: number
    /** Whether the occupant's socket is currently attached (always `true` for local seats). */
    readonly connected: boolean
}

/**
 * Where the game currently is.
 *
 * `lobby` → seat setup · `board` → picking a clue · `dailyDouble` → hidden wager clue,
 * host picks the seat and its wager before the prompt is shown · `clue` → clue shown,
 * buzzers open · `buzzed` → a seat is answering, awaiting adjudication ·
 * `paused` → host absent · `done` → every clue revealed.
 */
export type GamePhase = 'lobby' | 'board' | 'dailyDouble' | 'clue' | 'buzzed' | 'paused' | 'done'

/** A single buzz attempt, stamped in server time after latency correction (M3). */
export interface BuzzEntry {
    readonly seatIndex: number
    readonly at: number
}

export interface GameState {
    /** Host view of the board, including solutions. Player clients get a redacted copy. */
    readonly board: Game
    readonly seats: readonly Seat[]
    readonly phase: GamePhase
    /** Phase to return to once the host comes back; only set while `phase === 'paused'`. */
    readonly pausedFrom: GamePhase | null
    readonly currentClueId: string | null
    readonly revealedClueIds: readonly string[]
    /** Buzzes for the current clue, earliest corrected timestamp first. */
    readonly buzzOrder: readonly BuzzEntry[]
    /** Seat currently holding the buzz, or `null` when nobody is answering. */
    readonly activeSeatIndex: number | null
    /** Seats that already answered the current clue wrong and may not buzz again. */
    readonly lockedSeatIndexes: readonly number[]
    /** Seat playing the open Daily Double, chosen by the host; `null` for normal clues. */
    readonly wagerSeatIndex: number | null
    /** Accepted wager for the open Daily Double; scored instead of the clue value. */
    readonly wager: number | null
}

/** Inclusive range a Daily Double wager must fall into. */
export interface WagerBounds {
    readonly min: number
    readonly max: number
}

/** A seat with its final rank, as shown on the results screen. */
export interface Standing {
    readonly seatIndex: number
    readonly name: string
    readonly score: number
    /** `1`-based rank; seats with an equal score share a rank. */
    readonly rank: number
}
