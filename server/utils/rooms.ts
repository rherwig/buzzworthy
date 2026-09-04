import { randomBytes, randomUUID } from 'node:crypto'
import {
    ROOM_CODE_ALPHABET,
    ROOM_CODE_LENGTH,
    createGameState,
    type GameState,
} from '~~/shared/game'
import type { Game } from '~~/shared/types/game'

/**
 * The room registry: server-authoritative live games, keyed by room code.
 *
 * Rooms are intentionally **not** persisted (docs/JEOPARDY.md §5) — a running game is
 * ephemeral. The in-memory implementation sits behind `RoomStore` as the single seam
 * so it can move to Redis or a table later without touching the transport or the rules.
 */

/** A room is dropped once nothing has happened in it for this long. */
export const ROOM_TTL_MS = 4 * 60 * 60 * 1000

export interface Room {
    readonly code: string
    /** Secret proving host authority; survives a reload so the host can reclaim the room. */
    readonly hostToken: string
    /** The authoritative game. Replaced wholesale by the reducer, never mutated. */
    state: GameState
    lastActivityAt: number
}

export interface RoomStore {
    create(board: Game, seatCount?: number): Room
    get(code: string): Room | null
    /** Apply a reducer transition to a room and return the updated room. */
    update(code: string, transition: (state: GameState) => GameState): Room | null
    remove(code: string): void
    /** Drop rooms idle for longer than `ROOM_TTL_MS`; returns how many were dropped. */
    prune(now?: number): number
    readonly size: number
}

function randomCode(): string {
    return Array.from(
        randomBytes(ROOM_CODE_LENGTH),
        (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length] ?? 'A',
    ).join('')
}

/**
 * Rooms in a plain `Map`.
 *
 * Exported as a factory so tests get an isolated store instead of sharing the
 * process-wide one.
 */
export function createMemoryRoomStore(): RoomStore {
    const rooms = new Map<string, Room>()

    function freeCode(): string {
        let code = randomCode()

        while (rooms.has(code)) {
            code = randomCode()
        }

        return code
    }

    function get(code: string): Room | null {
        return rooms.get(code) ?? null
    }

    function prune(now: number = Date.now()): number {
        let dropped = 0

        for (const [code, room] of rooms) {
            if (now - room.lastActivityAt > ROOM_TTL_MS) {
                rooms.delete(code)
                dropped += 1
            }
        }

        return dropped
    }

    return {
        create(board, seatCount) {
            // Opportunistic GC: rooms are only ever created by a human clicking
            // "host a game", so this is a cheap, timer-free place to collect stale ones.
            prune()

            const code = freeCode()
            const room: Room = {
                code,
                hostToken: randomUUID(),
                state: createGameState(board, seatCount),
                lastActivityAt: Date.now(),
            }

            rooms.set(code, room)

            return room
        },
        get,
        update(code, transition) {
            const room = get(code)

            if (room === null) {
                return null
            }

            room.state = transition(room.state)
            room.lastActivityAt = Date.now()

            return room
        },
        remove(code) {
            rooms.delete(code)
        },
        prune,
        get size() {
            return rooms.size
        },
    }
}

/** The store this server instance runs on. */
export const roomStore: RoomStore = createMemoryRoomStore()
