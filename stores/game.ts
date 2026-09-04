import { defineStore } from 'pinia'
import { gameSchema, type Game } from '~~/shared/types/game'
import {
    adjudicate,
    buzz,
    canStartGame,
    chooseWagerSeat,
    claimSeat,
    closeClue,
    createGameState,
    currentClue,
    endGame,
    kickSeat,
    openClue,
    pause,
    renameSeat,
    resume,
    seatSetupError,
    setSeatCount,
    setSeatKind,
    setWager,
    standings,
    startGame,
    wagerBounds,
    type ClientMessage,
    type GameState,
    type RoomRole,
    type RoomView,
    type SeatKind,
} from '~~/shared/game'

/**
 * Client-side holder of the live game.
 *
 * The store owns no rules. It is a facade over two interchangeable backends:
 *
 * - **offline** (hotseat) — every action runs through the pure reducer in `shared/game`
 *   right here in the browser;
 * - **online** — a transport is attached (see `useRoom`), the action is sent to the
 *   server as a `ClientMessage`, and the state is replaced by whatever the server
 *   broadcasts back.
 *
 * Each action therefore declares both forms once, which is what lets the very same
 * pages and components serve a hotseat game, an online host and a remote player.
 *
 * State is kept in a `shallowRef` because it is always replaced wholesale — deep
 * reactivity would only add overhead and could hide the immutable-update contract.
 */

/** How the store talks to a room; implemented by the WebSocket connection. */
export interface RoomTransport {
    send(message: ClientMessage): void
}

export const useGameStore = defineStore('game', () => {
    const state = shallowRef<GameState | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const transport = shallowRef<RoomTransport | null>(null)
    const code = ref<string | null>(null)
    const role = ref<RoomRole>('host')
    /** Seat this client occupies online; `null` for the host and for hotseat play. */
    const mySeatIndex = ref<number | null>(null)

    const online = computed(() => transport.value !== null)
    const isHost = computed(() => role.value === 'host')

    const phase = computed(() => state.value?.phase ?? null)
    const seats = computed(() => state.value?.seats ?? [])
    const board = computed(() => state.value?.board ?? null)
    const clue = computed(() => (state.value === null ? null : currentClue(state.value)))
    const activeSeat = computed(() =>
        state.value === null || state.value.activeSeatIndex === null
            ? null
            : (seats.value.find((seat) => seat.index === state.value?.activeSeatIndex) ?? null),
    )
    const mySeat = computed(() =>
        mySeatIndex.value === null
            ? null
            : (seats.value.find((seat) => seat.index === mySeatIndex.value) ?? null),
    )
    const setupError = computed(() => (state.value === null ? null : seatSetupError(state.value)))
    const canStart = computed(() => state.value !== null && canStartGame(state.value))
    const results = computed(() => (state.value === null ? [] : standings(state.value)))
    const wagerRange = computed(() => (state.value === null ? null : wagerBounds(state.value)))
    const wagerSeat = computed(() =>
        state.value === null || state.value.wagerSeatIndex === null
            ? null
            : (seats.value.find((seat) => seat.index === state.value?.wagerSeatIndex) ?? null),
    )

    /** Run a reducer transition against the current state; a no-op without a game. */
    function apply(transition: (current: GameState) => GameState): void {
        if (state.value === null) {
            return
        }

        state.value = transition(state.value)
    }

    /**
     * Perform an action: over the wire when online, through the reducer when not.
     * `local` is never used online — the server's broadcast is the only truth there.
     */
    function dispatch(message: ClientMessage, local: (current: GameState) => GameState): void {
        if (transport.value !== null) {
            transport.value.send(message)

            return
        }

        apply(local)
    }

    /** Open a lobby for a board that has already been fetched (used by tests and SSR). */
    function openLobby(fetched: Game, seatCount?: number): void {
        state.value = createGameState(fetched, seatCount)
        error.value = null
    }

    /** Fetch a board by id and open a lobby for it. */
    async function loadBoard(gameId: string, seatCount?: number): Promise<void> {
        loading.value = true
        error.value = null

        try {
            openLobby(gameSchema.parse(await $fetch(`/api/games/${gameId}`)), seatCount)
        } catch {
            state.value = null
            error.value = 'Could not load that board.'
        } finally {
            loading.value = false
        }
    }

    /** Bind the store to a room; from now on actions travel over the wire. */
    function attach(roomCode: string, roomTransport: RoomTransport): void {
        code.value = roomCode
        transport.value = roomTransport
    }

    /** Room snapshot from the server: it replaces the local state completely. */
    function receive(view: RoomView, viewerRole: RoomRole, seatIndex: number | null): void {
        state.value = view
        role.value = viewerRole
        mySeatIndex.value = seatIndex
        error.value = null
    }

    function reset(): void {
        state.value = null
        error.value = null
        transport.value = null
        code.value = null
        role.value = 'host'
        mySeatIndex.value = null
    }

    return {
        state,
        loading,
        error,
        code,
        role,
        online,
        isHost,
        mySeatIndex,
        mySeat,
        phase,
        seats,
        board,
        clue,
        activeSeat,
        setupError,
        canStart,
        results,
        wagerRange,
        wagerSeat,
        openLobby,
        loadBoard,
        attach,
        receive,
        reset,
        // Lobby
        setSeatCount: (count: number) =>
            dispatch({ type: 'setSeatCount', count }, (current) => setSeatCount(current, count)),
        setSeatKind: (index: number, kind: SeatKind) =>
            dispatch({ type: 'setSeatKind', seatIndex: index, kind }, (current) =>
                setSeatKind(current, index, kind),
            ),
        renameSeat: (index: number, name: string) =>
            dispatch({ type: 'renameSeat', seatIndex: index, name }, (current) =>
                renameSeat(current, index, name),
            ),
        kickSeat: (index: number) =>
            dispatch({ type: 'kickSeat', seatIndex: index }, (current) => kickSeat(current, index)),
        claimSeat: (index: number, name: string, occupantId: string) =>
            dispatch({ type: 'claimSeat', seatIndex: index, name }, (current) =>
                claimSeat(current, index, occupantId, name),
            ),
        startGame: () => dispatch({ type: 'startGame' }, startGame),
        // Play
        openClue: (clueId: string) =>
            dispatch({ type: 'openClue', clueId }, (current) => openClue(current, clueId)),
        chooseWagerSeat: (seatIndex: number) =>
            dispatch({ type: 'chooseWagerSeat', seatIndex }, (current) =>
                chooseWagerSeat(current, seatIndex),
            ),
        setWager: (amount: number) =>
            dispatch({ type: 'setWager', amount }, (current) => setWager(current, amount)),
        buzz: (seatIndex: number, at: number = Date.now()) =>
            dispatch({ type: 'buzz', seatIndex, at }, (current) => buzz(current, seatIndex, at)),
        adjudicate: (correct: boolean) =>
            dispatch({ type: 'adjudicate', correct }, (current) => adjudicate(current, correct)),
        closeClue: () => dispatch({ type: 'closeClue' }, closeClue),
        endGame: () => dispatch({ type: 'endGame' }, endGame),
        // Host presence is the server's business online, so these stay local-only.
        pause: () => apply(pause),
        resume: () => apply(resume),
    }
})
