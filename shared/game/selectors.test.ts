import { describe, it, expect } from 'vitest'
import { makeBoard } from './game.fixture'
import {
    allClues,
    canSeatBuzz,
    currentClue,
    findClue,
    isClueRevealed,
    isSeatOccupied,
    occupiedSeats,
    remainingClueCount,
    seatAt,
    standings,
} from './selectors'
import {
    adjudicate,
    buzz,
    claimSeat,
    createGameState,
    openClue,
    renameSeat,
    setSeatCount,
    setSeatKind,
    startGame,
} from './state'
import type { GameState, Seat } from './types'

function makeSeat(index: number, score: number): Seat {
    return { index, kind: 'local', name: `P${index + 1}`, occupantId: null, score, connected: true }
}

function stateWithScores(scores: number[]): GameState {
    const base = createGameState(makeBoard(), 2)

    return { ...base, seats: scores.map((score, index) => makeSeat(index, score)) }
}

describe('board queries', () => {
    it('flattens the board in category then row order', () => {
        expect(allClues(makeBoard(2, 2)).map((clue) => clue.id)).toEqual([
            'clue-0-0',
            'clue-0-1',
            'clue-1-0',
            'clue-1-1',
        ])
    })

    it('finds a clue by id and returns null for an unknown one', () => {
        expect(findClue(makeBoard(), 'clue-1-1')?.value).toBe(200)
        expect(findClue(makeBoard(), 'nope')).toBeNull()
    })

    it('tracks the open clue and how many are left', () => {
        const started = startGame(setSeatCount(createGameState(makeBoard()), 2))
        expect(remainingClueCount(started)).toBe(4)
        expect(currentClue(started)).toBeNull()

        const played = adjudicate(buzz(openClue(started, 'clue-0-0'), 0, 1), true)
        expect(remainingClueCount(played)).toBe(3)
        expect(isClueRevealed(played, 'clue-0-0')).toBe(true)
        expect(isClueRevealed(played, 'clue-0-1')).toBe(false)
    })
})

describe('standings', () => {
    it('sorts by score, highest first', () => {
        expect(standings(stateWithScores([100, 500, 300])).map((entry) => entry.seatIndex)).toEqual(
            [1, 2, 0],
        )
    })

    it('shares a rank on equal scores and keeps seat order', () => {
        expect(standings(stateWithScores([300, 300, 100]))).toEqual([
            { seatIndex: 0, name: 'P1', score: 300, rank: 1 },
            { seatIndex: 1, name: 'P2', score: 300, rank: 1 },
            { seatIndex: 2, name: 'P3', score: 100, rank: 3 },
        ])
    })

    it('leaves out seats nobody occupies', () => {
        const state = stateWithScores([100, 200])
        const withClosed: GameState = {
            ...state,
            seats: [...state.seats, { ...makeSeat(2, 0), kind: 'closed', name: null }],
        }

        expect(standings(withClosed)).toHaveLength(2)
    })
})

describe('seat and buzz rules', () => {
    it('considers a local seat occupied only if it has a name', () => {
        const state = createGameState(makeBoard(), 2)
        const seat = seatAt(state, 0)
        expect(seat).not.toBeNull()
        if (seat) expect(isSeatOccupied(seat)).toBe(true)

        const unnamed = renameSeat(state, 0, '')
        const unnamedSeat = seatAt(unnamed, 0)
        expect(unnamedSeat).not.toBeNull()
        if (unnamedSeat) expect(isSeatOccupied(unnamedSeat)).toBe(false)
    })

    it('considers an open seat occupied only when claimed', () => {
        const state = setSeatKind(createGameState(makeBoard(), 2), 0, 'open')
        const seat = seatAt(state, 0)
        expect(seat).not.toBeNull()
        if (seat) expect(isSeatOccupied(seat)).toBe(false)

        const claimed = claimSeat(state, 0, 'occ-1', 'Grace')
        const claimedSeat = seatAt(claimed, 0)
        expect(claimedSeat).not.toBeNull()
        if (claimedSeat) expect(isSeatOccupied(claimedSeat)).toBe(true)
    })

    it('filters the occupied seats list', () => {
        const state = createGameState(makeBoard(), 3)
        const partial = renameSeat(setSeatKind(state, 1, 'closed'), 2, '')

        const occupied = occupiedSeats(partial)
        expect(occupied).toHaveLength(1)
        expect(occupied[0]?.index).toBe(0)
    })

    it('allows a seat to buzz in clue or buzzed phase, but not on Daily Doubles', () => {
        const started = startGame(setSeatCount(createGameState(makeBoard()), 2))
        const clue = openClue(started, 'clue-0-0')

        expect(canSeatBuzz(clue, 0)).toBe(true)

        // In buzzed phase (before window closes), others can still buzz
        const buzzed = buzz(clue, 1, 1_000)
        expect(canSeatBuzz(buzzed, 0)).toBe(true)

        const ddBoard = makeBoard(2, 2, 'dd')
        const ddGame = openClue(startGame(setSeatCount(createGameState(ddBoard), 2)), 'dd')
        expect(canSeatBuzz(ddGame, 0)).toBe(false)
    })

    it('locks out seats that already answered wrong', () => {
        const started = startGame(setSeatCount(createGameState(makeBoard()), 2))
        const buzzed = buzz(openClue(started, 'clue-0-0'), 0, 1_000)
        const wrong = adjudicate(buzzed, false)

        expect(canSeatBuzz(wrong, 0)).toBe(false)
        expect(canSeatBuzz(wrong, 1)).toBe(true)
    })
})
