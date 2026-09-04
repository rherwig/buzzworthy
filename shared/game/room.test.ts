import { describe, expect, it } from 'vitest'
import {
    OCCUPIED_BY_OTHER,
    displayNameSchema,
    joinPath,
    roomCodeSchema,
    roomViewSchema,
    toRoomView,
} from './room'
import { makeBoard } from './game.fixture'
import type { Game, PublicGame } from '../types/game'
import type { GameState } from './types'

describe('roomCodeSchema', () => {
    it('accepts valid 5-letter codes', () => {
        expect(roomCodeSchema.parse('ACDEF')).toBe('ACDEF')
    })

    it('trims and upper-cases input', () => {
        expect(roomCodeSchema.parse('  acdef  ')).toBe('ACDEF')
    })

    it('rejects codes with wrong length', () => {
        expect(roomCodeSchema.safeParse('ACDE').success).toBe(false)
        expect(roomCodeSchema.safeParse('ACDEFG').success).toBe(false)
    })

    it('rejects ambiguous characters like O, 0, I, 1', () => {
        expect(roomCodeSchema.safeParse('ACD0E').success).toBe(false)
        expect(roomCodeSchema.safeParse('ACDOE').success).toBe(false)
        expect(roomCodeSchema.safeParse('ACD1E').success).toBe(false)
        expect(roomCodeSchema.safeParse('ACDIE').success).toBe(false)
    })
})

describe('displayNameSchema', () => {
    it('accepts valid names and trims them', () => {
        expect(displayNameSchema.parse('  Alice  ')).toBe('Alice')
    })

    it('rejects empty or too long names', () => {
        expect(displayNameSchema.safeParse('').success).toBe(false)
        expect(displayNameSchema.safeParse('   ').success).toBe(false)
        expect(displayNameSchema.safeParse('a'.repeat(25)).success).toBe(false)
    })
})

describe('joinPath', () => {
    it('returns the path to the join screen', () => {
        expect(joinPath('ACDEF')).toBe('/join/ACDEF')
    })
})

describe('toRoomView', () => {
    const board = makeBoard()
    const state: GameState = {
        board,
        seats: [
            {
                index: 0,
                kind: 'open',
                name: 'Alice',
                occupantId: 'id-0',
                score: 0,
                connected: true,
            },
            {
                index: 1,
                kind: 'open',
                name: 'Bob',
                occupantId: 'id-1',
                score: 0,
                connected: true,
            },
        ],
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

    it('projects for the host (keeps solutions, masks all occupantIds)', () => {
        const view = toRoomView(state, 'host')

        expect(roomViewSchema.parse(view)).toEqual(view)

        // Solutions should be present
        const hostBoard = view.board as Game
        expect(hostBoard.categories[0]?.clues[0]?.solution).toBeDefined()

        // OccupantIds should be masked
        expect(view.seats[0]?.occupantId).toBe(OCCUPIED_BY_OTHER)
        expect(view.seats[1]?.occupantId).toBe(OCCUPIED_BY_OTHER)
    })

    it('projects for a player (masks solutions, preserves own occupantId)', () => {
        const view = toRoomView(state, 'player', 'id-0')

        expect(roomViewSchema.parse(view)).toEqual(view)

        // Solutions should be MISSING
        const playerBoard = view.board as PublicGame
        expect(playerBoard.categories[0]?.clues[0]).not.toHaveProperty('solution')

        // Viewer's own id survives
        expect(view.seats[0]?.occupantId).toBe('id-0')
        // Other player's id is masked
        expect(view.seats[1]?.occupantId).toBe(OCCUPIED_BY_OTHER)
    })
})
