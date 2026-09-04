import { z } from 'zod'
import { gameSchema, publicGameSchema, toPublicGame } from '../types/game'
import { MAX_SEATS, MIN_SEATS } from './state'
import type { GameState, Seat } from './types'

/**
 * Room identity and the per-viewer projection of the live game (docs/JEOPARDY.md §7).
 *
 * The server owns one `GameState` per room and sends every client a *view* of it:
 * the host sees the board with solutions, players see the redacted board. Both views
 * are the same shape, so the browser can run the very same selectors as the server.
 */

/** Room codes avoid characters that are easy to misread aloud (`0/O`, `1/I`, …). */
export const ROOM_CODE_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679'

export const ROOM_CODE_LENGTH = 5

/** Codes travel in URLs and are typed by hand, so they are compared upper-cased. */
export const roomCodeSchema = z
    .string()
    .trim()
    .toUpperCase()
    .length(ROOM_CODE_LENGTH)
    .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]+$`), 'Unknown room code.')

export const displayNameSchema = z.string().trim().min(1).max(24)

/** Who a connected client is allowed to be. */
export type RoomRole = 'host' | 'player'

/**
 * Placeholder written into `Seat.occupantId` for seats belonging to *someone else*.
 *
 * Occupant ids are the only thing standing between a player and their seat on
 * reconnect, so they never reach another client — but "this seat is taken" has to,
 * because the shared selectors decide who may play from that field.
 */
export const OCCUPIED_BY_OTHER = 'taken'

const seatViewSchema = z.object({
    index: z.number().int().nonnegative(),
    kind: z.enum(['local', 'open', 'closed']),
    name: z.string().nullable(),
    occupantId: z.string().nullable(),
    score: z.number().int(),
    connected: z.boolean(),
})

/**
 * A `GameState` as it travels over the wire. The board is either the host's copy or
 * the redacted one, which is why it is a union rather than plain `gameSchema`.
 */
export const roomViewSchema = z.object({
    board: z.union([gameSchema, publicGameSchema]),
    seats: z.array(seatViewSchema),
    phase: z.enum(['lobby', 'board', 'dailyDouble', 'clue', 'buzzed', 'paused', 'done']),
    pausedFrom: z
        .enum(['lobby', 'board', 'dailyDouble', 'clue', 'buzzed', 'paused', 'done'])
        .nullable(),
    currentClueId: z.string().nullable(),
    revealedClueIds: z.array(z.string()),
    buzzOrder: z.array(z.object({ seatIndex: z.number().int(), at: z.number() })),
    activeSeatIndex: z.number().int().nullable(),
    lockedSeatIndexes: z.array(z.number().int()),
    wagerSeatIndex: z.number().int().nullable(),
    wager: z.number().int().nullable(),
})

/**
 * The view is structurally a `GameState`, so client code can feed it straight into
 * the shared selectors; only the board's solutions may be missing.
 */
export type RoomView = z.infer<typeof roomViewSchema>

/** Body of `POST /api/rooms`. */
export const createRoomInputSchema = z.object({
    gameId: z.string().min(1),
    seatCount: z.number().int().min(MIN_SEATS).max(MAX_SEATS).optional(),
})

export type CreateRoomInput = z.infer<typeof createRoomInputSchema>

/** Answer to `POST /api/rooms` — the host's credentials for the new room. */
export const createRoomResultSchema = z.object({
    code: roomCodeSchema,
    hostToken: z.string().min(1),
    /** Path to hand to players, e.g. `/join/ACDEF`. */
    joinPath: z.string().min(1),
})

export type CreateRoomResult = z.infer<typeof createRoomResultSchema>

/** Answer to `GET /api/rooms/:code` — just enough for the join screen. */
export const roomSummarySchema = z.object({
    code: roomCodeSchema,
    title: z.string().min(1),
    phase: roomViewSchema.shape.phase,
    /** Seats a player may still claim. */
    openSeatIndexes: z.array(z.number().int().nonnegative()),
})

export type RoomSummary = z.infer<typeof roomSummarySchema>

/** Screens that exist both for a hotseat game and for an online room. */
export type RoomPage = 'lobby' | 'play' | 'results'

/**
 * Route for a screen, with the room code appended when there is one.
 *
 * Hotseat and online play share the same pages (`/play` vs `/play/ACDEF`), so this is
 * the single place that knows the shape of those URLs.
 */
export function roomRoute(page: RoomPage, code?: string | null): string {
    return code === null || code === undefined ? `/${page}` : `/${page}/${code}`
}

/** Where a player is sent to claim a seat. */
export function joinPath(code: string): string {
    return `/join/${code}`
}

function maskSeat(seat: Seat, occupantId: string | null): Seat {
    if (seat.occupantId === null || seat.occupantId === occupantId) {
        return seat
    }

    return { ...seat, occupantId: OCCUPIED_BY_OTHER }
}

/**
 * Project the authoritative state for one recipient.
 *
 * Players get a board without solutions and other people's occupant ids masked;
 * the host gets the full board but is masked just the same, because it has no use
 * for player ids either.
 */
export function toRoomView(
    state: GameState,
    role: RoomRole,
    occupantId: string | null = null,
): RoomView {
    const board: RoomView['board'] = role === 'host' ? state.board : toPublicGame(state.board)

    return {
        ...state,
        board,
        seats: state.seats.map((seat) => maskSeat(seat, occupantId)),
        buzzOrder: state.buzzOrder.map((entry) => ({ ...entry })),
        revealedClueIds: [...state.revealedClueIds],
        lockedSeatIndexes: [...state.lockedSeatIndexes],
    }
}
