import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createGameState, startGame, toRoomView, type ClientMessage } from '~~/shared/game'
import { makeBoard } from '~~/shared/game/game.fixture'
import { useGameStore } from './game'

describe('game store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('starts empty', () => {
        const store = useGameStore()

        expect(store.state).toBeNull()
        expect(store.phase).toBeNull()
        expect(store.seats).toEqual([])
        expect(store.canStart).toBe(false)
    })

    it('ignores actions while no game is open', () => {
        const store = useGameStore()

        store.openClue('clue-0-0')
        store.buzz(0)

        expect(store.state).toBeNull()
    })

    it('opens a lobby and exposes the seat setup', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(), 2)

        expect(store.phase).toBe('lobby')
        expect(store.seats).toHaveLength(2)
        expect(store.setupError).toBeNull()
        expect(store.canStart).toBe(true)
    })

    it('reports why an invalid lobby cannot start', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(), 2)
        store.renameSeat(0, '')

        expect(store.canStart).toBe(false)
        expect(store.setupError).toBe('Every local seat needs a name.')

        store.startGame()
        expect(store.phase).toBe('lobby')
    })

    it('plays a clue through to a scored board', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(), 2)
        store.renameSeat(0, 'Ada')
        store.startGame()
        store.openClue('clue-0-0')

        expect(store.clue?.prompt).toBe('Prompt 0-0')

        store.buzz(1, 1_000)
        expect(store.activeSeat?.name).toBe('Player 2')

        store.adjudicate(true)
        expect(store.phase).toBe('board')
        expect(store.results[0]).toMatchObject({ name: 'Player 2', score: 100, rank: 1 })
    })

    it('pauses and resumes without losing the open clue', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(), 2)
        store.startGame()
        store.openClue('clue-0-1')
        store.pause()

        expect(store.phase).toBe('paused')

        store.resume()
        expect(store.phase).toBe('clue')
        expect(store.clue?.id).toBe('clue-0-1')
    })

    it('exposes the daily double wager range for the chosen seat', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(2, 2, 'clue-0-1'), 2)
        store.startGame()
        store.openClue('clue-0-1')

        expect(store.phase).toBe('dailyDouble')
        expect(store.wagerRange).toBeNull()

        store.chooseWagerSeat(1)
        expect(store.wagerSeat?.name).toBe('Player 2')
        expect(store.wagerRange).toEqual({ min: 5, max: 200 })

        store.setWager(75)
        store.adjudicate(true)
        expect(store.results[0]).toMatchObject({ name: 'Player 2', score: 75 })
    })

    it('sends actions over the wire instead of applying them once online', () => {
        const store = useGameStore()
        const sent: ClientMessage[] = []

        store.openLobby(makeBoard(), 2)
        store.attach('ACDEF', { send: (message) => sent.push(message) })

        store.startGame()
        store.buzz(1, 1_000)

        // The server is the only authority online: nothing changed locally.
        expect(store.phase).toBe('lobby')
        expect(sent).toEqual([{ type: 'startGame' }, { type: 'buzz', seatIndex: 1, at: 1_000 }])
    })

    it('replaces its state with the room snapshot it receives', () => {
        const store = useGameStore()
        const view = toRoomView(startGame(createGameState(makeBoard(), 2)), 'player', 'occupant-1')

        store.receive(view, 'player', 1)

        expect(store.phase).toBe('board')
        expect(store.isHost).toBe(false)
        expect(store.mySeat?.index).toBe(1)
        // A player device never receives the solutions.
        expect(store.board?.categories[0]?.clues[0]).not.toHaveProperty('solution')
    })

    it('clears everything on reset', () => {
        const store = useGameStore()
        store.openLobby(makeBoard(), 2)
        store.reset()

        expect(store.state).toBeNull()
        expect(store.error).toBeNull()
    })
})
