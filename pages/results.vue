<script setup lang="ts">
import { UiButton } from '~/shared/ui'

/**
 * End-of-game screen (docs/JEOPARDY.md M2). The game only lives in memory, so a
 * direct visit or a refresh has nothing to show and goes back to the board picker;
 * a game still in progress returns to the board.
 */
const game = useGameStore()
const router = useRouter()

const winners = computed(() => game.results.filter((entry) => entry.rank === 1))

onMounted(() => {
    if (game.state === null) {
        void router.replace('/')
    } else if (game.phase !== 'done') {
        void router.replace('/play')
    }
})

function newGame(): void {
    game.reset()
    void router.push('/')
}
</script>

<template>
    <div v-if="game.state" class="mx-auto max-w-xl space-y-8">
        <div>
            <h1 class="text-3xl font-bold">Final standings</h1>
            <p class="mt-2 text-muted">{{ game.board?.title }}</p>
        </div>

        <p v-if="winners.length > 0" class="text-xl font-semibold">
            {{ winners.length > 1 ? 'It is a tie:' : 'Winner:' }}
            {{ winners.map((entry) => entry.name).join(' & ') }}
        </p>

        <StandingsList :standings="game.results" />

        <UiButton @click="newGame">New game</UiButton>
    </div>
</template>
