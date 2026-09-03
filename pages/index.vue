<script setup lang="ts">
import { gameSummaryListSchema, type GameSummary } from '~~/shared/types/game'
import { UiButton } from '~/shared/ui'

// Board picker: choose one of the seeded boards and open a lobby for it.
const { data: boards, error } = await useFetch('/api/games', {
    transform: (payload): GameSummary[] => gameSummaryListSchema.parse(payload),
})

const game = useGameStore()

async function host(id: string): Promise<void> {
    await game.loadBoard(id)

    if (game.state !== null) {
        await navigateTo('/lobby')
    }
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h1 class="text-3xl font-bold">Jeopardy</h1>
            <p class="mt-2 text-muted">
                Pick a board, set up the seats and play. Local players share this screen; online
                seats join from their own device.
            </p>
        </div>

        <p v-if="error" class="text-sm text-muted">
            Could not load the boards. Have you run <code>pnpm db:seed</code>?
        </p>

        <ul v-else class="space-y-3">
            <li
                v-for="board in boards"
                :key="board.id"
                class="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
            >
                <div>
                    <h2 class="text-xl font-semibold">{{ board.title }}</h2>
                    <p class="text-sm text-muted">
                        {{ board.categoryCount }} categories · {{ board.clueCount }} clues
                    </p>
                </div>
                <UiButton :disabled="game.loading" @click="host(board.id)">Host</UiButton>
            </li>
        </ul>

        <p v-if="game.error" class="text-sm text-muted">{{ game.error }}</p>
    </div>
</template>
