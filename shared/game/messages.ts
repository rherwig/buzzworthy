import { z } from 'zod'
import { displayNameSchema, roomViewSchema } from './room'
import { MAX_SEATS, MIN_SEATS, MIN_WAGER } from './state'

/**
 * The room protocol (docs/JEOPARDY.md §7).
 *
 * Every inbound frame is parsed with `clientMessageSchema` before it can reach the
 * reducer, and every broadcast is a `ServerMessage`. Both live in `shared/` so the
 * browser and Nitro are literally compile-checked against the same contract.
 *
 * Host-only messages are *not* separated by schema: authority is a property of the
 * connection, not of the payload, so the WS handler checks the role instead.
 */

const seatIndexSchema = z
    .number()
    .int()
    .min(0)
    .max(MAX_SEATS - 1)
const timestampSchema = z.number().int().positive()

/** Anything a client may send. */
export const clientMessageSchema = z.discriminatedUnion('type', [
    // --- Any client -----------------------------------------------------------
    /** Answer to a `ping`, carrying the client's own clock for offset estimation. */
    z.object({ type: z.literal('pong'), serverSent: timestampSchema, clientTime: timestampSchema }),
    /** A player takes an `open` seat. */
    z.object({ type: z.literal('claimSeat'), seatIndex: seatIndexSchema, name: displayNameSchema }),
    /**
     * Buzz in. `at` is the *client's* clock; the server corrects it before the
     * reducer sees it. The host sends this too, on behalf of a local seat.
     */
    z.object({ type: z.literal('buzz'), seatIndex: seatIndexSchema, at: timestampSchema }),

    // --- Host only ------------------------------------------------------------
    z.object({
        type: z.literal('setSeatCount'),
        count: z.number().int().min(MIN_SEATS).max(MAX_SEATS),
    }),
    z.object({
        type: z.literal('setSeatKind'),
        seatIndex: seatIndexSchema,
        kind: z.enum(['local', 'open', 'closed']),
    }),
    z.object({
        type: z.literal('renameSeat'),
        seatIndex: seatIndexSchema,
        name: z.string().max(24),
    }),
    z.object({ type: z.literal('kickSeat'), seatIndex: seatIndexSchema }),
    z.object({ type: z.literal('startGame') }),
    z.object({ type: z.literal('openClue'), clueId: z.string().min(1) }),
    z.object({ type: z.literal('chooseWagerSeat'), seatIndex: seatIndexSchema }),
    z.object({ type: z.literal('setWager'), amount: z.number().int().min(MIN_WAGER) }),
    z.object({ type: z.literal('adjudicate'), correct: z.boolean() }),
    z.object({ type: z.literal('closeClue') }),
    z.object({ type: z.literal('endGame') }),
])

export type ClientMessage = z.infer<typeof clientMessageSchema>

/** Message types only the host connection is allowed to send. */
export const HOST_ONLY_MESSAGES = [
    'setSeatCount',
    'setSeatKind',
    'renameSeat',
    'kickSeat',
    'startGame',
    'openClue',
    'chooseWagerSeat',
    'setWager',
    'adjudicate',
    'closeClue',
    'endGame',
] as const satisfies readonly ClientMessage['type'][]

export function isHostOnlyMessage(type: ClientMessage['type']): boolean {
    return (HOST_ONLY_MESSAGES as readonly string[]).includes(type)
}

/** Anything the server may send. */
export const serverMessageSchema = z.discriminatedUnion('type', [
    /**
     * The full authoritative state, projected for this recipient. The server always
     * sends whole snapshots: a game board is small, and it removes any chance of a
     * client drifting out of sync from a missed delta.
     */
    z.object({
        type: z.literal('state'),
        role: z.enum(['host', 'player']),
        /** Seat this connection occupies, or `null` for the host and unseated players. */
        seatIndex: z.number().int().nullable(),
        state: roomViewSchema,
    }),
    /** Clock-sync probe; the client echoes `serverSent` back in a `pong`. */
    z.object({ type: z.literal('ping'), serverSent: timestampSchema }),
    /** A rejected action. Advisory only — the next `state` frame remains the truth. */
    z.object({ type: z.literal('error'), message: z.string() }),
])

export type ServerMessage = z.infer<typeof serverMessageSchema>
