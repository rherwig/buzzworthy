import { defineStore } from 'pinia'
import { gameSchema, type Game } from '~~/shared/types/game'
import {
    adjudicate,
    buzz,
    canStartGame,
    closeClue,
    createGameState,
    currentClue,
    endGame,
    openClue,
    pause,
    renameSeat,
    resume,
    seatSetupError,
    setSeatCount,
    setSeatKind,
    standings,
    startGame,
    type GameState,
    type SeatKind,
} from '~~/shared/game'

/**
 * Client-side holder of the live game.
 *
 * The store owns no rules: every transition is delegated to the pure reducer in
 * `shared/game`, so the exact same logic will run in Nitro once the room becomes
 * server-authoritative (docs/JEOPARDY.md §6) and this store degrades to a mirror.
 *
 * State is kept in a `shallowRef` because the reducer replaces it wholesale — deep
 * reactivity would only add overhead and could hide the immutable-update contract.
 */
export const useGameStore = defineStore('game', () => {
    const state = shallowRef<GameState | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const phase = computed(() => state.value?.phase ?? null)
    const seats = computed(() => state.value?.seats ?? [])
    const board = computed(() => state.value?.board ?? null)
    const clue = computed(() => (state.value === null ? null : currentClue(state.value)))
    const activeSeat = computed(() =>
        state.value === null || state.value.activeSeatIndex === null
            ? null
            : (seats.value.find((seat) => seat.index === state.value?.activeSeatIndex) ?? null),
    )
    const setupError = computed(() => (state.value === null ? null : seatSetupError(state.value)))
    const canStart = computed(() => state.value !== null && canStartGame(state.value))
    const results = computed(() => (state.value === null ? [] : standings(state.value)))

    /** Run a reducer transition against the current state; a no-op without a game. */
    function apply(transition: (current: GameState) => GameState): void {
        if (state.value === null) {
            return
        }

        state.value = transition(state.value)
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

    function reset(): void {
        state.value = null
        error.value = null
    }

    return {
        state,
        loading,
        error,
        phase,
        seats,
        board,
        clue,
        activeSeat,
        setupError,
        canStart,
        results,
        openLobby,
        loadBoard,
        reset,
        // Lobby
        setSeatCount: (count: number) => apply((current) => setSeatCount(current, count)),
        setSeatKind: (index: number, kind: SeatKind) =>
            apply((current) => setSeatKind(current, index, kind)),
        renameSeat: (index: number, name: string) =>
            apply((current) => renameSeat(current, index, name)),
        startGame: () => apply(startGame),
        // Play
        openClue: (clueId: string) => apply((current) => openClue(current, clueId)),
        buzz: (seatIndex: number, at: number = Date.now()) =>
            apply((current) => buzz(current, seatIndex, at)),
        adjudicate: (correct: boolean) => apply((current) => adjudicate(current, correct)),
        closeClue: () => apply(closeClue),
        pause: () => apply(pause),
        resume: () => apply(resume),
        endGame: () => apply(endGame),
    }
})
