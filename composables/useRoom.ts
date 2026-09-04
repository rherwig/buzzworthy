import { serverMessageSchema, type ClientMessage } from '~~/shared/game'

/**
 * The client end of the room channel (docs/JEOPARDY.md §7).
 *
 * Owns the socket and nothing else: it authenticates, answers clock probes, validates
 * every inbound frame and hands snapshots to the game store, which it also binds as
 * the store's transport so that every action from a page travels over this connection.
 *
 * Identity is deliberately anonymous (Q4): a random occupant id in `localStorage`
 * survives a refresh, so a player reconnects into the seat it already holds, and the
 * host token does the same for host authority.
 */

const OCCUPANT_KEY = 'jeopardy:occupant'
const HOST_TOKEN_PREFIX = 'jeopardy:host:'

/** Delay before a dropped connection is retried, in ms. */
const RECONNECT_DELAY_MS = 1_000

function readStorage(key: string): string | null {
    return import.meta.client ? window.localStorage.getItem(key) : null
}

/** Remember the host token for a room so a reload can reclaim the host role (Q1e). */
export function rememberHostToken(code: string, token: string): void {
    if (import.meta.client) {
        window.localStorage.setItem(`${HOST_TOKEN_PREFIX}${code}`, token)
    }
}

export function readHostToken(code: string): string | null {
    return readStorage(`${HOST_TOKEN_PREFIX}${code}`)
}

/** This browser's anonymous, persistent player id; created on first use. */
export function useOccupantId(): string {
    const existing = readStorage(OCCUPANT_KEY)

    if (existing !== null) {
        return existing
    }

    const id = crypto.randomUUID()

    if (import.meta.client) {
        window.localStorage.setItem(OCCUPANT_KEY, id)
    }

    return id
}

export interface RoomConnection {
    /** `true` once the socket is open. */
    readonly connected: Readonly<Ref<boolean>>
    send(message: ClientMessage): void
}

function socketUrl(code: string): string {
    const hostToken = readHostToken(code)
    const credentials =
        hostToken === null ? `occupantId=${useOccupantId()}` : `hostToken=${hostToken}`
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

    return `${scheme}//${window.location.host}/_ws/room?code=${code}&${credentials}`
}

/**
 * Connect to a room for as long as the calling component lives.
 *
 * The host is recognised by the token this browser stored when it created the room;
 * every other visitor connects as a player.
 */
export function useRoom(code: string): RoomConnection {
    const game = useGameStore()
    const connected = ref(false)

    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let closing = false

    function send(message: ClientMessage): void {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message))
        }
    }

    function handle(raw: string): void {
        const parsed = serverMessageSchema.safeParse(JSON.parse(raw) as unknown)

        if (!parsed.success) {
            return
        }

        const message = parsed.data

        if (message.type === 'state') {
            game.receive(message.state, message.role, message.seatIndex)

            return
        }

        if (message.type === 'ping') {
            // Answer immediately: the round trip is what the server's latency
            // compensation is measured from, so any delay here skews it.
            send({ type: 'pong', serverSent: message.serverSent, clientTime: Date.now() })

            return
        }

        game.error = message.message
    }

    function connect(): void {
        socket = new WebSocket(socketUrl(code))

        socket.onopen = () => {
            connected.value = true
        }

        socket.onmessage = (event: MessageEvent<string>) => handle(event.data)

        socket.onclose = () => {
            connected.value = false

            if (!closing) {
                retry = setTimeout(connect, RECONNECT_DELAY_MS)
            }
        }
    }

    onMounted(() => {
        game.attach(code, { send })
        connect()
    })

    onBeforeUnmount(() => {
        closing = true

        if (retry !== null) {
            clearTimeout(retry)
        }

        socket?.close()
        game.reset()
    })

    return { connected, send }
}
