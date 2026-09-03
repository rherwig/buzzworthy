import type { Clue, Game } from '../types/game'
import type { GameState, Seat, Standing } from './types'

/**
 * Pure, side-effect-free queries over `GameState`.
 *
 * Components and the Pinia store read the state through these helpers instead of
 * re-deriving rules, so the same answers are used by the client and by Nitro (M3).
 */

/** Every clue on the board, in category then row order. */
export function allClues(board: Game): Clue[] {
    return board.categories.flatMap((category) => category.clues)
}

export function findClue(board: Game, clueId: string): Clue | null {
    return allClues(board).find((clue) => clue.id === clueId) ?? null
}

export function isClueRevealed(state: GameState, clueId: string): boolean {
    return state.revealedClueIds.includes(clueId)
}

/** The clue currently on screen, if any. */
export function currentClue(state: GameState): Clue | null {
    return state.currentClueId === null ? null : findClue(state.board, state.currentClueId)
}

/**
 * A seat takes part in the game once it has an owner: a named local seat, or an
 * `open` seat claimed by a remote occupant. `closed` seats never play.
 */
export function isSeatOccupied(seat: Seat): boolean {
    if (seat.kind === 'local') {
        return seat.name !== null
    }

    return seat.kind === 'open' && seat.occupantId !== null
}

export function occupiedSeats(state: GameState): Seat[] {
    return state.seats.filter(isSeatOccupied)
}

export function seatAt(state: GameState, index: number): Seat | null {
    return state.seats.find((seat) => seat.index === index) ?? null
}

/**
 * Whether a seat is allowed to buzz on the current clue.
 *
 * `buzzed` counts as open too: while the host has not adjudicated yet, a buzz that
 * travelled slowly may still arrive and win on its corrected timestamp. Closing that
 * collection window is the transport layer's job (docs/JEOPARDY.md §7).
 */
export function canSeatBuzz(state: GameState, seatIndex: number): boolean {
    const seat = seatAt(state, seatIndex)

    return (
        (state.phase === 'clue' || state.phase === 'buzzed') &&
        seat !== null &&
        isSeatOccupied(seat) &&
        !state.lockedSeatIndexes.includes(seatIndex)
    )
}

export function remainingClueCount(state: GameState): number {
    return allClues(state.board).length - state.revealedClueIds.length
}

/** Highest score first; equal scores share a rank and keep seat order. */
export function standings(state: GameState): Standing[] {
    const ranked = occupiedSeats(state)
        .map((seat) => ({
            seatIndex: seat.index,
            name: seat.name ?? `Seat ${seat.index + 1}`,
            score: seat.score,
        }))
        .sort((a, b) => b.score - a.score || a.seatIndex - b.seatIndex)

    let rank = 0
    let previousScore: number | null = null

    return ranked.map((entry, position) => {
        if (entry.score !== previousScore) {
            rank = position + 1
            previousScore = entry.score
        }

        return { ...entry, rank }
    })
}
