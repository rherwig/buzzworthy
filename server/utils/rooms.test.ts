import { describe, expect, it, vi } from 'vitest'
import { createMemoryRoomStore, ROOM_TTL_MS } from './rooms'
import { makeBoard } from '~~/shared/game/game.fixture'

describe('createMemoryRoomStore', () => {
    it('creates a room in the lobby phase with a valid code', () => {
        const store = createMemoryRoomStore()
        const board = makeBoard()
        const room = store.create(board)

        expect(room.code).toHaveLength(5)
        expect(room.hostToken).toBeDefined()
        expect(room.state.phase).toBe('lobby')
        expect(room.lastActivityAt).toBeLessThanOrEqual(Date.now())
    })

    it('generates unique codes', () => {
        const store = createMemoryRoomStore()
        const board = makeBoard()
        const codes = new Set()

        for (let i = 0; i < 100; i++) {
            const room = store.create(board)
            expect(codes.has(room.code)).toBe(false)
            codes.add(room.code)
        }
    })

    it('returns null for unknown codes', () => {
        const store = createMemoryRoomStore()
        expect(store.get('NOPE')).toBeNull()
    })

    it('updates room state and refreshes activity timestamp', () => {
        vi.useFakeTimers()
        const store = createMemoryRoomStore()
        const room = store.create(makeBoard())
        const initialActivity = room.lastActivityAt

        vi.advanceTimersByTime(1000)

        const updated = store.update(room.code, (state) => ({ ...state, phase: 'board' }))

        expect(updated?.state.phase).toBe('board')
        expect(updated?.lastActivityAt).toBe(initialActivity + 1000)
        vi.useRealTimers()
    })

    it('removes rooms', () => {
        const store = createMemoryRoomStore()
        const room = store.create(makeBoard())

        store.remove(room.code)
        expect(store.get(room.code)).toBeNull()
        expect(store.size).toBe(0)
    })

    it('prunes idle rooms while keeping active ones', () => {
        const store = createMemoryRoomStore()
        const board = makeBoard()

        const now = Date.now()
        const oldRoom = store.create(board)
        const freshRoom = store.create(board)

        expect(store.size).toBe(2)

        // Manually age one room
        oldRoom.lastActivityAt = now - ROOM_TTL_MS - 1000

        const droppedCount = store.prune(now)

        expect(droppedCount).toBe(1)
        expect(store.size).toBe(1)
        expect(store.get(oldRoom.code)).toBeNull()
        expect(store.get(freshRoom.code)).not.toBeNull()
    })
})
