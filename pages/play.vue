<script setup lang="ts">
import { MAX_SEATS } from '~~/shared/game'
import { UiButton } from '~/shared/ui'

/**
 * The host screen: board grid, live scores and the open clue.
 *
 * Local seats buzz from this keyboard — number keys map to seat 1…`MAX_SEATS`
 * (docs/JEOPARDY.md §7); online seats will send the same action over the wire in M3.
 */
const game = useGameStore()
const router = useRouter()

const boardDisabled = computed(() => game.phase !== 'board')

onMounted(() => {
    if (game.state === null) {
        void router.replace('/')

        return
    }

    window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function onKeydown(event: KeyboardEvent): void {
    const seatIndex = Number(event.key) - 1

    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= MAX_SEATS) {
        return
    }

    game.buzz(seatIndex)
}

function leave(): void {
    game.reset()
    void router.push('/')
}
</script>

<template>
    <div v-if="game.state" class="space-y-6">
        <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ game.board?.title }}</h1>
            <UiButton variant="ghost" size="sm" @click="leave">Leave game</UiButton>
        </div>

        <ScoreBoard :seats="game.seats" :active-seat-index="game.state.activeSeatIndex" />

        <section v-if="game.phase === 'done'" class="space-y-4">
            <h2 class="text-xl font-semibold">Final standings</h2>
            <ol class="space-y-2">
                <li
                    v-for="entry in game.results"
                    :key="entry.seatIndex"
                    class="flex justify-between rounded border border-border bg-surface px-4 py-3"
                >
                    <span>{{ entry.rank }}. {{ entry.name }}</span>
                    <span class="font-bold">{{ entry.score }}</span>
                </li>
            </ol>
            <UiButton @click="leave">New game</UiButton>
        </section>

        <template v-else>
            <p v-if="game.phase === 'paused'" class="text-sm text-muted">Waiting for the host…</p>

            <GameBoard
                :categories="game.board?.categories ?? []"
                :revealed-clue-ids="game.state.revealedClueIds"
                :disabled="boardDisabled"
                @select="game.openClue"
            />

            <ClueDialog
                v-if="game.clue"
                :clue="game.clue"
                :seats="game.seats"
                :active-seat="game.activeSeat"
                :locked-seat-indexes="game.state.lockedSeatIndexes"
                @buzz="game.buzz"
                @adjudicate="game.adjudicate"
                @close="game.closeClue"
            />
        </template>
    </div>
</template>
