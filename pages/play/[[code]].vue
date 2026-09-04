<script setup lang="ts">
import { MAX_SEATS } from '~~/shared/game'
import { UiButton } from '~/shared/ui'

/**
 * The game screen, for every kind of participant.
 *
 * - hotseat / online host: board grid, live scores, the open clue and adjudication.
 *   Local seats buzz from this keyboard — number keys map to seat 1…`MAX_SEATS`.
 * - online player: the same board and scores (Q1g), and a buzzer for its own seat
 *   inside the clue dialog; picking clues and judging answers stay with the host.
 */
const game = useGameStore()
const router = useRouter()
const { code, online, link } = useRoomPage()

const isHost = computed(() => !online || game.isHost)
const boardDisabled = computed(() => game.phase !== 'board' || !isHost.value)

// The board is over: the standings live on their own screen (docs/JEOPARDY.md M2).
watch(
    () => game.phase,
    (phase) => {
        if (phase === 'done') {
            void router.push(link('results'))
        }
    },
)

onMounted(() => {
    if (!online && game.state === null) {
        void router.replace('/')

        return
    }

    window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/** Host keyboard: one key per local seat (docs/JEOPARDY.md §7). */
function onKeydown(event: KeyboardEvent): void {
    const seatIndex = Number(event.key) - 1

    if (!isHost.value || !Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= MAX_SEATS) {
        return
    }

    game.buzz(seatIndex)
}

function leave(): void {
    game.reset()
    void router.push('/')
}

/** Stop early and go straight to the standings; scores are kept. */
function finish(): void {
    game.endGame()
}
</script>

<template>
    <div v-if="game.state" class="space-y-6">
        <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ game.board?.title }}</h1>
            <div v-if="isHost" class="flex gap-2">
                <UiButton variant="secondary" size="sm" @click="finish">End game</UiButton>
                <UiButton variant="ghost" size="sm" @click="leave">Leave game</UiButton>
            </div>
            <p v-else-if="game.mySeat" class="text-sm text-muted">
                Playing as {{ game.mySeat.name }}
            </p>
        </div>

        <ScoreBoard :seats="game.seats" :active-seat-index="game.state.activeSeatIndex" />

        <p v-if="game.phase === 'paused'" class="text-sm text-muted">Waiting for the host…</p>

        <GameBoard
            :categories="game.board?.categories ?? []"
            :revealed-clue-ids="game.state.revealedClueIds"
            :disabled="boardDisabled"
            @select="game.openClue"
        />

        <DailyDoubleDialog
            v-if="game.phase === 'dailyDouble' && isHost"
            :seats="game.seats"
            :wager-seat="game.wagerSeat"
            :bounds="game.wagerRange"
            @choose-seat="game.chooseWagerSeat"
            @wager="game.setWager"
            @close="game.closeClue"
        />

        <ClueDialog
            v-else-if="game.clue && game.phase !== 'dailyDouble'"
            :clue="game.clue"
            :seats="game.seats"
            :active-seat="game.activeSeat"
            :locked-seat-indexes="game.state.lockedSeatIndexes"
            :wager="game.state.wager"
            :own-seat-index="game.mySeatIndex"
            :can-adjudicate="isHost"
            @buzz="game.buzz"
            @adjudicate="game.adjudicate"
            @close="game.closeClue"
        />

        <p v-if="code" class="text-xs text-muted">Room {{ code }}</p>
    </div>
</template>
