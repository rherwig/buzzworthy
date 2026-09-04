import {
    adjudicate,
    buzz,
    chooseWagerSeat,
    claimSeat,
    clientMessageSchema,
    closeClue,
    correctBuzzTime,
    endGame,
    isHostOnlyMessage,
    kickSeat,
    openClue,
    pause,
    renameSeat,
    resume,
    roomCodeSchema,
    seatAt,
    setSeatConnected,
    setSeatCount,
    setSeatKind,
    setWager,
    startGame,
    toRoomView,
    updateOffset,
    type ClientMessage,
    type GameState,
    type RoomRole,
    type ServerMessage,
} from '~~/shared/game'

/**
 * The room channel (docs/JEOPARDY.md §7).
 *
 * This is the *transport*: it authenticates a connection, validates every frame with
 * Zod, keeps a clock-offset estimate per socket, and translates messages into calls on
 * the shared reducer. It contains no game rules — that is what makes the same logic
 * usable in the browser for a purely local game.
 *
 * Each recipient is sent its own projection of the state (`toRoomView`), so pub/sub
 * broadcast is not usable here: the host's frame contains solutions, a player's does not.
 */

/** How often a socket is probed to keep its clock offset fresh. */
const PING_INTERVAL_MS = 5_000

/** Minimal shape this handler needs from a crossws peer — keeps it easy to fake in tests. */
interface SocketPeer {
    send(data: string): unknown
    close(code?: number, reason?: string): unknown
    readonly request?: { url?: string }
}

interface Client {
    readonly peer: SocketPeer
    readonly code: string
    readonly role: RoomRole
    /** `null` for the host; a player's anonymous, cookie-backed id otherwise. */
    readonly occupantId: string | null
    /** `clientClock - serverClock` in ms, or `null` until the first pong. */
    offset: number | null
}

const clients = new Map<SocketPeer, Client>()
const probes = new Map<string, ReturnType<typeof setInterval>>()

function roomClients(code: string): Client[] {
    return [...clients.values()].filter((client) => client.code === code)
}

function send(peer: SocketPeer, message: ServerMessage): void {
    peer.send(JSON.stringify(message))
}

/** The seat a client owns, if any: the host owns none, a player owns the one it claimed. */
function seatIndexOf(state: GameState, client: Client): number | null {
    if (client.occupantId === null) {
        return null
    }

    return state.seats.find((seat) => seat.occupantId === client.occupantId)?.index ?? null
}

/** Push the current state to every client in the room, each in its own projection. */
function broadcast(code: string): void {
    const room = roomStore.get(code)

    if (room === null) {
        return
    }

    for (const client of roomClients(code)) {
        send(client.peer, {
            type: 'state',
            role: client.role,
            seatIndex: seatIndexOf(room.state, client),
            state: toRoomView(room.state, client.role, client.occupantId),
        })
    }
}

function startProbing(code: string): void {
    if (probes.has(code)) {
        return
    }

    probes.set(
        code,
        setInterval(() => {
            const serverSent = Date.now()

            for (const client of roomClients(code)) {
                send(client.peer, { type: 'ping', serverSent })
            }
        }, PING_INTERVAL_MS),
    )
}

function stopProbing(code: string): void {
    const probe = probes.get(code)

    if (probe !== undefined && roomClients(code).length === 0) {
        clearInterval(probe)
        probes.delete(code)
    }
}

/**
 * Who is connecting, based on the socket URL: `?code=…&hostToken=…` for the host,
 * `?code=…&occupantId=…` for a player. Returns `null` when the request makes no sense.
 */
function identify(peer: SocketPeer): Omit<Client, 'peer' | 'offset'> | null {
    const url = new URL(peer.request?.url ?? '', 'http://localhost')
    const code = roomCodeSchema.safeParse(url.searchParams.get('code') ?? '')

    if (!code.success) {
        return null
    }

    const room = roomStore.get(code.data)

    if (room === null) {
        return null
    }

    if (url.searchParams.get('hostToken') === room.hostToken) {
        return { code: room.code, role: 'host', occupantId: null }
    }

    const occupantId = url.searchParams.get('occupantId') ?? ''

    return occupantId.length > 0 ? { code: room.code, role: 'player', occupantId } : null
}

/**
 * Whether this connection is allowed to buzz for that seat: the host presses keys for
 * the local seats on the shared screen, a player only ever for its own (Q1a).
 */
function mayBuzzFor(state: GameState, client: Client, seatIndex: number): boolean {
    if (client.role === 'host') {
        return seatAt(state, seatIndex)?.kind === 'local'
    }

    return seatIndexOf(state, client) === seatIndex
}

/** Apply a transition to the room this client belongs to. */
function apply(client: Client, transition: (state: GameState) => GameState): void {
    roomStore.update(client.code, transition)
    broadcast(client.code)
}

/**
 * Turn a validated frame into a reducer call.
 *
 * Authority was already checked by the caller, so this only has to map message →
 * transition and refuse what a *player* still must not do: buzz for somebody else's
 * seat, or claim a second seat.
 */
function handleMessage(client: Client, message: ClientMessage, receivedAt: number): void {
    switch (message.type) {
        case 'pong':
            client.offset = updateOffset(client.offset, {
                serverSent: message.serverSent,
                clientTime: message.clientTime,
                serverReceived: receivedAt,
            })

            return
        case 'claimSeat': {
            const occupantId = client.occupantId

            if (occupantId === null) {
                send(client.peer, { type: 'error', message: 'The host cannot claim a seat.' })

                return
            }

            apply(client, (state) =>
                seatIndexOf(state, client) === null
                    ? claimSeat(state, message.seatIndex, occupantId, message.name)
                    : state,
            )

            return
        }
        case 'buzz': {
            const at = correctBuzzTime(message.at, client.offset ?? 0, receivedAt)

            apply(client, (state) =>
                mayBuzzFor(state, client, message.seatIndex)
                    ? buzz(state, message.seatIndex, at)
                    : state,
            )

            return
        }
        case 'setSeatCount':
            apply(client, (state) => setSeatCount(state, message.count))

            return
        case 'setSeatKind':
            apply(client, (state) => setSeatKind(state, message.seatIndex, message.kind))

            return
        case 'renameSeat':
            apply(client, (state) => renameSeat(state, message.seatIndex, message.name))

            return
        case 'kickSeat':
            apply(client, (state) => kickSeat(state, message.seatIndex))

            return
        case 'startGame':
            apply(client, startGame)

            return
        case 'openClue':
            apply(client, (state) => openClue(state, message.clueId))

            return
        case 'chooseWagerSeat':
            apply(client, (state) => chooseWagerSeat(state, message.seatIndex))

            return
        case 'setWager':
            apply(client, (state) => setWager(state, message.amount))

            return
        case 'adjudicate':
            apply(client, (state) => adjudicate(state, message.correct))

            return
        case 'closeClue':
            apply(client, closeClue)

            return
        case 'endGame':
            apply(client, endGame)
    }
}

export default defineWebSocketHandler({
    open(peer) {
        const identity = identify(peer)

        if (identity === null) {
            send(peer, { type: 'error', message: 'Unknown room.' })
            peer.close(4404, 'Unknown room')

            return
        }

        const client: Client = { ...identity, peer, offset: null }

        clients.set(client.peer, client)
        startProbing(client.code)

        // The host is back: unfreeze the room it left behind. A returning player only
        // flips its own seat back to connected.
        roomStore.update(client.code, (state) => {
            if (client.role === 'host') {
                return resume(state)
            }

            const seatIndex = seatIndexOf(state, client)

            return seatIndex === null ? state : setSeatConnected(state, seatIndex, true)
        })

        broadcast(client.code)
    },

    message(peer, message) {
        const client = clients.get(peer)

        if (client === undefined) {
            return
        }

        const receivedAt = Date.now()
        const parsed = clientMessageSchema.safeParse(safeJson(message.text()))

        if (!parsed.success) {
            send(client.peer, { type: 'error', message: 'Malformed message.' })

            return
        }

        if (isHostOnlyMessage(parsed.data.type) && client.role !== 'host') {
            send(client.peer, { type: 'error', message: 'Only the host may do that.' })

            return
        }

        handleMessage(client, parsed.data, receivedAt)
    },

    close(peer) {
        const client = clients.get(peer)

        if (client === undefined) {
            return
        }

        clients.delete(client.peer)

        const stillHosted = roomClients(client.code).some((other) => other.role === 'host')

        roomStore.update(client.code, (state) => {
            // No host socket left: freeze the room until the host token comes back (Q1e).
            if (!stillHosted) {
                return pause(state)
            }

            const seatIndex = seatIndexOf(state, client)

            return seatIndex === null ? state : setSeatConnected(state, seatIndex, false)
        })

        broadcast(client.code)
        stopProbing(client.code)
    },
})

function safeJson(raw: string): unknown {
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}
