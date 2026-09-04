import { describe, expect, it } from 'vitest'
import { clientMessageSchema, isHostOnlyMessage, serverMessageSchema } from './messages'
import { toRoomView } from './room'
import { MAX_SEATS, createGameState } from './state'
import { makeBoard } from './game.fixture'

describe('clientMessageSchema', () => {
    it('accepts valid pong frames', () => {
        const payload = { type: 'pong', serverSent: 1000, clientTime: 1200 }
        expect(clientMessageSchema.parse(payload)).toEqual(payload)
    })

    it('accepts valid claimSeat frames', () => {
        const payload = { type: 'claimSeat', seatIndex: 0, name: 'Alice' }
        expect(clientMessageSchema.parse(payload)).toEqual(payload)
    })

    it('accepts valid buzz frames', () => {
        const payload = { type: 'buzz', seatIndex: 1, at: 5000 }
        expect(clientMessageSchema.parse(payload)).toEqual(payload)
    })

    it('accepts valid host-only frames', () => {
        expect(clientMessageSchema.parse({ type: 'startGame' })).toEqual({ type: 'startGame' })
        expect(clientMessageSchema.parse({ type: 'openClue', clueId: 'clue-1' })).toEqual({
            type: 'openClue',
            clueId: 'clue-1',
        })
    })

    it('rejects unknown message types', () => {
        expect(clientMessageSchema.safeParse({ type: 'unknown' }).success).toBe(false)
    })

    it('rejects out-of-range seat indexes', () => {
        expect(clientMessageSchema.safeParse({ type: 'buzz', seatIndex: -1, at: 1 }).success).toBe(
            false,
        )
        expect(
            clientMessageSchema.safeParse({ type: 'buzz', seatIndex: MAX_SEATS, at: 1 }).success,
        ).toBe(false)
    })

    it('rejects malformed payloads', () => {
        expect(clientMessageSchema.safeParse({ type: 'claimSeat', seatIndex: 0 }).success).toBe(
            false,
        )
        expect(clientMessageSchema.safeParse({ type: 'openClue', clueId: '' }).success).toBe(false)
    })
})

describe('isHostOnlyMessage', () => {
    it('returns true for host actions', () => {
        expect(isHostOnlyMessage('startGame')).toBe(true)
        expect(isHostOnlyMessage('openClue')).toBe(true)
        expect(isHostOnlyMessage('adjudicate')).toBe(true)
        expect(isHostOnlyMessage('setSeatCount')).toBe(true)
    })

    it('returns false for player actions', () => {
        expect(isHostOnlyMessage('pong')).toBe(false)
        expect(isHostOnlyMessage('claimSeat')).toBe(false)
        expect(isHostOnlyMessage('buzz')).toBe(false)
    })
})

describe('serverMessageSchema', () => {
    it('accepts a state frame built from toRoomView', () => {
        const state = createGameState(makeBoard(), 2)
        const view = toRoomView(state, 'player', 'id-1')

        const message = {
            type: 'state',
            role: 'player',
            seatIndex: 1,
            state: view,
        }

        expect(serverMessageSchema.parse(message)).toEqual(message)
    })

    it('accepts ping and error frames', () => {
        expect(serverMessageSchema.parse({ type: 'ping', serverSent: 1234 })).toBeDefined()
        expect(serverMessageSchema.parse({ type: 'error', message: 'Fail' })).toBeDefined()
    })
})
