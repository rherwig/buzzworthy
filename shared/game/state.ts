import type { Game } from '../types/game'
import { allClues, canSeatBuzz, findClue, isSeatOccupied, occupiedSeats, seatAt } from './selectors'
import type { GamePhase, GameState, Seat, SeatKind, WagerBounds } from './types'

/**
 * The game reducer: pure transitions from one `GameState` to the next.
 *
 * Framework-agnostic on purpose — the same functions run in the browser for a local
 * hotseat game and in Nitro once the room is server-authoritative (docs/JEOPARDY.md §6).
 * Every function returns a new state and never mutates its input; an action that is not
 * legal in the current phase returns the state unchanged, so callers need no try/catch.
 */

export const MIN_SEATS = 2
export const MAX_SEATS = 6
export const DEFAULT_SEAT_COUNT = 3

/** Seats a game needs before it may start. */
export const MIN_OCCUPIED_SEATS = 2

/** Smallest Daily Double wager (docs/JEOPARDY.md §6). */
export const MIN_WAGER = 5

function makeSeat(index: number, kind: SeatKind = 'local'): Seat {
    return {
        index,
        kind,
        name: kind === 'local' ? `Player ${index + 1}` : null,
        occupantId: null,
        score: 0,
        connected: kind === 'local',
    }
}

/**
 * A fresh lobby for a board.
 *
 * All seats start as `local`, which is the M1 hotseat setup; the host switches them to
 * `open`/`closed` once online play lands (M3).
 */
export function createGameState(board: Game, seatCount: number = DEFAULT_SEAT_COUNT): GameState {
    const count = clampSeatCount(seatCount)

    return {
        board,
        seats: Array.from({ length: count }, (_unused, index) => makeSeat(index)),
        phase: 'lobby',
        pausedFrom: null,
        currentClueId: null,
        revealedClueIds: [],
        buzzOrder: [],
        activeSeatIndex: null,
        lockedSeatIndexes: [],
        wagerSeatIndex: null,
        wager: null,
    }
}

function clampSeatCount(seatCount: number): number {
    return Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.trunc(seatCount)))
}

function mapSeat(state: GameState, index: number, change: (seat: Seat) => Seat): GameState {
    if (seatAt(state, index) === null) {
        return state
    }

    return {
        ...state,
        seats: state.seats.map((seat) => (seat.index === index ? change(seat) : seat)),
    }
}

/** Trim and normalise a name; an empty name means "unnamed". */
function normaliseName(name: string): string | null {
    const trimmed = name.trim()

    return trimmed.length > 0 ? trimmed : null
}

// --- Lobby (host only) -------------------------------------------------------

/** Grow or shrink the lobby, keeping existing seats and their setup. */
export function setSeatCount(state: GameState, seatCount: number): GameState {
    if (state.phase !== 'lobby') {
        return state
    }

    const count = clampSeatCount(seatCount)

    return {
        ...state,
        seats: Array.from(
            { length: count },
            (_unused, index) => seatAt(state, index) ?? makeSeat(index),
        ),
    }
}

export function setSeatKind(state: GameState, index: number, kind: SeatKind): GameState {
    if (state.phase !== 'lobby') {
        return state
    }

    return mapSeat(state, index, (seat) =>
        seat.kind === kind ? seat : { ...makeSeat(index, kind), score: seat.score },
    )
}

export function renameSeat(state: GameState, index: number, name: string): GameState {
    if (state.phase !== 'lobby') {
        return state
    }

    return mapSeat(state, index, (seat) => ({ ...seat, name: normaliseName(name) }))
}

/** A remote player takes an `open` seat. Ignored if the seat is already taken. */
export function claimSeat(
    state: GameState,
    index: number,
    occupantId: string,
    name: string,
): GameState {
    const seat = seatAt(state, index)

    if (seat === null || seat.kind !== 'open' || seat.occupantId !== null) {
        return state
    }

    return mapSeat(state, index, (current) => ({
        ...current,
        occupantId,
        name: normaliseName(name),
        connected: true,
    }))
}

/** Free a seat: the occupant is removed, the seat stays `open` for the next player. */
export function kickSeat(state: GameState, index: number): GameState {
    const seat = seatAt(state, index)

    if (seat === null || seat.kind === 'closed') {
        return state
    }

    return mapSeat(state, index, (current) => makeSeat(current.index, current.kind))
}

/**
 * Why the lobby cannot start yet, or `null` when the setup is valid.
 * Returned as a message so the host UI can explain itself without duplicating rules.
 */
export function seatSetupError(state: GameState): string | null {
    if (state.seats.some((seat) => seat.kind === 'local' && seat.name === null)) {
        return 'Every local seat needs a name.'
    }

    if (occupiedSeats(state).length < MIN_OCCUPIED_SEATS) {
        return `At least ${MIN_OCCUPIED_SEATS} seats must be occupied.`
    }

    return null
}

export function canStartGame(state: GameState): boolean {
    return state.phase === 'lobby' && seatSetupError(state) === null
}

export function startGame(state: GameState): GameState {
    if (!canStartGame(state)) {
        return state
    }

    return { ...state, phase: 'board' }
}

// --- Play --------------------------------------------------------------------

/**
 * Reveal a clue. A normal clue opens the buzzers straight away; a Daily Double first
 * goes through the wager phase, where the host names the seat that uncovered it and
 * how much it risks. Already-revealed clues are ignored.
 */
export function openClue(state: GameState, clueId: string): GameState {
    if (state.phase !== 'board') {
        return state
    }

    const clue = findClue(state.board, clueId)

    if (clue === null || state.revealedClueIds.includes(clueId)) {
        return state
    }

    return {
        ...state,
        phase: clue.isDailyDouble ? 'dailyDouble' : 'clue',
        currentClueId: clueId,
        buzzOrder: [],
        activeSeatIndex: null,
        lockedSeatIndexes: [],
        wagerSeatIndex: null,
        wager: null,
    }
}

// --- Daily Double ------------------------------------------------------------

/**
 * The range the nominated seat may wager, or `null` while no Daily Double is being
 * set up. A seat may always risk at least the clue's face value, which keeps the
 * range usable for a seat sitting on zero or a negative score.
 *
 * Lives here rather than in `selectors.ts` because it shares `MIN_WAGER` with the
 * transition that enforces it — one rule, one place.
 */
export function wagerBounds(state: GameState): WagerBounds | null {
    const clue = state.currentClueId === null ? null : findClue(state.board, state.currentClueId)
    const seat = state.wagerSeatIndex === null ? null : seatAt(state, state.wagerSeatIndex)

    if (state.phase !== 'dailyDouble' || clue === null || seat === null) {
        return null
    }

    return { min: MIN_WAGER, max: Math.max(seat.score, clue.value) }
}

/** The seat the host nominated to play the open Daily Double. */
export function chooseWagerSeat(state: GameState, seatIndex: number): GameState {
    const seat = seatAt(state, seatIndex)

    if (state.phase !== 'dailyDouble' || state.wager !== null) {
        return state
    }

    if (seat === null || !isSeatOccupied(seat)) {
        return state
    }

    return { ...state, wagerSeatIndex: seatIndex }
}

/**
 * Accept the wager and hand the clue to the nominated seat — nobody else may answer,
 * so the game goes straight to `buzzed`. Out-of-range amounts are rejected rather than
 * clamped, so the host UI has to offer a valid number in the first place.
 */
export function setWager(state: GameState, amount: number): GameState {
    const bounds = wagerBounds(state)

    if (state.phase !== 'dailyDouble' || bounds === null || state.wagerSeatIndex === null) {
        return state
    }

    if (!Number.isInteger(amount) || amount < bounds.min || amount > bounds.max) {
        return state
    }

    return { ...state, phase: 'buzzed', wager: amount, activeSeatIndex: state.wagerSeatIndex }
}

/**
 * Record a buzz. `atCorrected` is a timestamp **already translated into server time**;
 * latency compensation belongs to the transport layer (docs/JEOPARDY.md §7), which keeps
 * this reducer deterministic. The seat with the smallest corrected timestamp wins, so a
 * buzz that arrives late but was stamped earlier still takes the clue.
 */
export function buzz(state: GameState, seatIndex: number, atCorrected: number): GameState {
    if (!canSeatBuzz(state, seatIndex)) {
        return state
    }

    if (state.buzzOrder.some((entry) => entry.seatIndex === seatIndex)) {
        return state
    }

    const buzzOrder = [...state.buzzOrder, { seatIndex, at: atCorrected }].sort(
        (a, b) => a.at - b.at || a.seatIndex - b.seatIndex,
    )
    const winner = buzzOrder[0]

    if (winner === undefined) {
        return state
    }

    return { ...state, phase: 'buzzed', buzzOrder, activeSeatIndex: winner.seatIndex }
}

/**
 * Score the buzzed seat. A correct answer closes the clue; a wrong one subtracts the
 * value, locks that seat out of this clue and reopens the buzzers for everyone else.
 */
export function adjudicate(state: GameState, correct: boolean): GameState {
    const clue = state.currentClueId === null ? null : findClue(state.board, state.currentClueId)

    if (state.phase !== 'buzzed' || state.activeSeatIndex === null || clue === null) {
        return state
    }

    const seatIndex = state.activeSeatIndex
    const stake = state.wager ?? clue.value
    const delta = correct ? stake : -stake
    const scored = mapSeat(state, seatIndex, (seat) => ({ ...seat, score: seat.score + delta }))

    // A Daily Double belongs to one seat only: right or wrong, the clue is over.
    if (correct || state.wager !== null) {
        return closeClue(scored)
    }

    const reopened: GameState = {
        ...scored,
        phase: 'clue',
        activeSeatIndex: null,
        buzzOrder: scored.buzzOrder.filter((entry) => entry.seatIndex !== seatIndex),
        lockedSeatIndexes: [...scored.lockedSeatIndexes, seatIndex],
    }

    const anyoneLeft = occupiedSeats(reopened).some((seat) => canSeatBuzz(reopened, seat.index))

    return anyoneLeft ? reopened : closeClue(reopened)
}

/**
 * Put the clue away without scoring it — used when nobody buzzes. The clue counts as
 * revealed either way, so a board always runs down to `done`.
 */
export function closeClue(state: GameState): GameState {
    const closable: GamePhase[] = ['clue', 'buzzed', 'dailyDouble']

    if (state.currentClueId === null || !closable.includes(state.phase)) {
        return state
    }

    const revealedClueIds = [...state.revealedClueIds, state.currentClueId]
    const finished = revealedClueIds.length >= allClues(state.board).length

    return {
        ...state,
        phase: finished ? 'done' : 'board',
        currentClueId: null,
        buzzOrder: [],
        activeSeatIndex: null,
        lockedSeatIndexes: [],
        wagerSeatIndex: null,
        wager: null,
        revealedClueIds,
    }
}

/** Host left: freeze the room. No action is accepted again until `resume`. */
export function pause(state: GameState): GameState {
    const pausable: GamePhase[] = ['board', 'dailyDouble', 'clue', 'buzzed']

    if (!pausable.includes(state.phase)) {
        return state
    }

    return { ...state, phase: 'paused', pausedFrom: state.phase }
}

/** Host is back: continue exactly where the room stopped. */
export function resume(state: GameState): GameState {
    if (state.phase !== 'paused' || state.pausedFrom === null) {
        return state
    }

    return { ...state, phase: state.pausedFrom, pausedFrom: null }
}

/** End the game early; scores are kept so the results screen still works. */
export function endGame(state: GameState): GameState {
    if (state.phase === 'lobby' || state.phase === 'done') {
        return state
    }

    return {
        ...state,
        phase: 'done',
        currentClueId: null,
        activeSeatIndex: null,
        buzzOrder: [],
        wagerSeatIndex: null,
        wager: null,
    }
}

/** Mark a remote occupant's connection state (M3); local seats are always connected. */
export function setSeatConnected(state: GameState, index: number, connected: boolean): GameState {
    return mapSeat(state, index, (seat) =>
        isSeatOccupied(seat) && seat.kind === 'open' ? { ...seat, connected } : seat,
    )
}
