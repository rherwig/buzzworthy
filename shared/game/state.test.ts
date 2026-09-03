import { describe, it, expect } from 'vitest'
import { makeBoard } from './game.fixture'
import {
    MAX_SEATS,
    MIN_SEATS,
    adjudicate,
    buzz,
    canStartGame,
    claimSeat,
    closeClue,
    createGameState,
    endGame,
    kickSeat,
    openClue,
    pause,
    renameSeat,
    resume,
    seatSetupError,
    setSeatCount,
    setSeatKind,
    startGame,
} from './state'
import { seatAt, standings } from './selectors'
import type { GameState } from './types'

/** A started 2-seat game on a 2×2 board (clue values 100 and 200). */
function startedGame(): GameState {
    return startGame(setSeatCount(createGameState(makeBoard()), 2))
}

/** Play a clue to the point where seat `seatIndex` holds the buzz. */
function buzzedGame(seatIndex = 0, clueId = 'clue-0-0'): GameState {
    return buzz(openClue(startedGame(), clueId), seatIndex, 1_000)
}

describe('createGameState', () => {
    it('opens a lobby of named local seats', () => {
        const state = createGameState(makeBoard(), 4)

        expect(state.phase).toBe('lobby')
        expect(state.seats).toHaveLength(4)
        expect(state.seats.every((seat) => seat.kind === 'local' && seat.name !== null)).toBe(true)
        expect(state.revealedClueIds).toEqual([])
    })

    it('clamps the seat count to the supported range', () => {
        expect(createGameState(makeBoard(), 1).seats).toHaveLength(MIN_SEATS)
        expect(createGameState(makeBoard(), 99).seats).toHaveLength(MAX_SEATS)
    })
})

describe('lobby', () => {
    it('keeps existing seats when the lobby grows', () => {
        const state = renameSeat(createGameState(makeBoard(), 2), 0, 'Ada')
        const grown = setSeatCount(state, 4)

        expect(seatAt(grown, 0)?.name).toBe('Ada')
        expect(grown.seats).toHaveLength(4)
    })

    it('treats a blank name as unnamed and blocks the start', () => {
        const state = renameSeat(createGameState(makeBoard(), 2), 0, '   ')

        expect(seatAt(state, 0)?.name).toBeNull()
        expect(seatSetupError(state)).toBe('Every local seat needs a name.')
        expect(canStartGame(state)).toBe(false)
    })

    it('requires at least two occupied seats', () => {
        const state = setSeatKind(createGameState(makeBoard(), 2), 1, 'closed')

        expect(seatSetupError(state)).toContain('At least 2 seats')
        expect(startGame(state).phase).toBe('lobby')
    })

    it('counts an open seat only once a player claims it', () => {
        const lobby = setSeatKind(createGameState(makeBoard(), 2), 1, 'open')
        expect(canStartGame(lobby)).toBe(false)

        const claimed = claimSeat(lobby, 1, 'occupant-1', 'Grace')
        expect(seatAt(claimed, 1)?.name).toBe('Grace')
        expect(canStartGame(claimed)).toBe(true)
    })

    it('lets exactly one occupant claim an open seat', () => {
        const claimed = claimSeat(
            setSeatKind(createGameState(makeBoard(), 2), 1, 'open'),
            1,
            'a',
            'Ada',
        )
        const stolen = claimSeat(claimed, 1, 'b', 'Bob')

        expect(seatAt(stolen, 1)?.occupantId).toBe('a')
    })

    it('frees a kicked seat but keeps its kind', () => {
        const claimed = claimSeat(
            setSeatKind(createGameState(makeBoard(), 2), 1, 'open'),
            1,
            'a',
            'Ada',
        )
        const kicked = kickSeat(claimed, 1)

        expect(seatAt(kicked, 1)).toMatchObject({ kind: 'open', name: null, occupantId: null })
    })

    it('ignores unknown seat indexes and lobby actions after the start', () => {
        const lobby = createGameState(makeBoard(), 2)
        expect(renameSeat(lobby, 9, 'Nobody')).toBe(lobby)

        const started = startedGame()
        expect(renameSeat(started, 0, 'Late')).toBe(started)
        expect(setSeatCount(started, 6)).toBe(started)
    })
})

describe('openClue', () => {
    it('reveals a clue and opens the buzzers', () => {
        const state = openClue(startedGame(), 'clue-0-0')

        expect(state.phase).toBe('clue')
        expect(state.currentClueId).toBe('clue-0-0')
    })

    it('ignores unknown, already played and out-of-phase clues', () => {
        const started = startedGame()
        expect(openClue(started, 'nope')).toBe(started)

        const played = closeClue(openClue(started, 'clue-0-0'))
        expect(openClue(played, 'clue-0-0')).toBe(played)

        const open = openClue(started, 'clue-0-1')
        expect(openClue(open, 'clue-1-0')).toBe(open)
    })
})

describe('buzz', () => {
    it('awards the clue to the smallest corrected timestamp, not the first to arrive', () => {
        const open = openClue(startedGame(), 'clue-0-0')
        const late = buzz(open, 0, 1_500)
        const earlier = buzz(late, 1, 1_200)

        expect(earlier.activeSeatIndex).toBe(1)
        expect(earlier.buzzOrder.map((entry) => entry.seatIndex)).toEqual([1, 0])
    })

    it('resolves an identical corrected instant deterministically by seat order', () => {
        const open = openClue(startedGame(), 'clue-0-0')

        expect(buzz(buzz(open, 1, 1_000), 0, 1_000).activeSeatIndex).toBe(0)
        expect(buzz(buzz(open, 0, 1_000), 1, 1_000).activeSeatIndex).toBe(0)
    })

    it('is ignored outside the clue phase, twice from one seat, and from closed seats', () => {
        const started = startedGame()
        expect(buzz(started, 0, 1_000)).toBe(started)

        const buzzed = buzzedGame(0)
        expect(buzz(buzzed, 0, 900)).toBe(buzzed)

        const withClosed = openClue(
            startGame(setSeatKind(setSeatCount(createGameState(makeBoard()), 3), 2, 'closed')),
            'clue-0-0',
        )
        expect(buzz(withClosed, 2, 1_000)).toBe(withClosed)
    })
})

describe('adjudicate', () => {
    it('adds the clue value and closes the clue on a correct answer', () => {
        const state = adjudicate(buzzedGame(0), true)

        expect(seatAt(state, 0)?.score).toBe(100)
        expect(state.phase).toBe('board')
        expect(state.revealedClueIds).toEqual(['clue-0-0'])
        expect(state.activeSeatIndex).toBeNull()
    })

    it('subtracts on a wrong answer and reopens the buzzers for the others', () => {
        const state = adjudicate(buzzedGame(0), false)

        expect(seatAt(state, 0)?.score).toBe(-100)
        expect(state.phase).toBe('clue')
        expect(state.lockedSeatIndexes).toEqual([0])
        expect(buzz(state, 0, 2_000)).toBe(state)
        expect(buzz(state, 1, 2_000).activeSeatIndex).toBe(1)
    })

    it('closes the clue once every seat has answered wrong', () => {
        const first = adjudicate(buzzedGame(0), false)
        const state = adjudicate(buzz(first, 1, 2_000), false)

        expect(state.phase).toBe('board')
        expect(state.revealedClueIds).toEqual(['clue-0-0'])
        expect(standings(state).map((entry) => entry.score)).toEqual([-100, -100])
    })

    it('scores a clue only once', () => {
        const state = adjudicate(buzzedGame(0), true)

        expect(adjudicate(state, true)).toBe(state)
        expect(seatAt(state, 0)?.score).toBe(100)
    })

    it('does not mutate the state it is given', () => {
        const buzzed = buzzedGame(0)
        const snapshot = structuredClone(buzzed)

        adjudicate(buzzed, true)

        expect(buzzed).toEqual(snapshot)
    })
})

describe('end of game', () => {
    it('finishes when the last clue is revealed', () => {
        const board = makeBoard(1, 1)
        let state = startGame(setSeatCount(createGameState(board), 2))
        state = adjudicate(buzz(openClue(state, 'clue-0-0'), 0, 1_000), true)

        expect(state.phase).toBe('done')
        expect(state.currentClueId).toBeNull()
    })

    it('keeps scores when the host ends the game early', () => {
        const scored = adjudicate(buzzedGame(0), true)
        const ended = endGame(scored)

        expect(ended.phase).toBe('done')
        expect(standings(ended)[0]).toMatchObject({ seatIndex: 0, score: 100, rank: 1 })
        expect(endGame(ended)).toBe(ended)
    })
})

describe('pause / resume', () => {
    it('freezes the room and refuses every action until the host returns', () => {
        const paused = pause(openClue(startedGame(), 'clue-0-0'))

        expect(paused.phase).toBe('paused')
        expect(buzz(paused, 0, 1_000)).toBe(paused)
        expect(closeClue(paused)).toBe(paused)
        expect(adjudicate(paused, true)).toBe(paused)
    })

    it('resumes in the phase it stopped in', () => {
        const buzzed = buzzedGame(0)
        const resumed = resume(pause(buzzed))

        expect(resumed.phase).toBe('buzzed')
        expect(resumed.activeSeatIndex).toBe(0)
        expect(resumed.pausedFrom).toBeNull()
    })

    it('cannot be paused in the lobby, and resume is a no-op when running', () => {
        const lobby = createGameState(makeBoard(), 2)
        expect(pause(lobby)).toBe(lobby)

        const started = startedGame()
        expect(resume(started)).toBe(started)
    })
})
