<script setup lang="ts">
import {
    ROOM_CODE_LENGTH,
    createRoomResultSchema,
    joinPath,
    roomRoute,
    roomCodeSchema,
} from '~~/shared/game'
import { gameSummaryListSchema, type GameSummary } from '~~/shared/types/game'
import { UiButton } from '~/shared/ui'

/**
 * Board picker and front door.
 *
 * A board can be hosted locally (hotseat, everything stays in this browser) or as an
 * online room, which asks the server for a code and a join link (docs/JEOPARDY.md §7).
 * Players arrive here too, with a code in hand.
 */
const { data: boards, error } = await useFetch('/api/games', {
    transform: (payload): GameSummary[] => gameSummaryListSchema.parse(payload),
})

const game = useGameStore()

const joinCode = ref('')
const joinError = ref<string | null>(null)

async function hostLocal(id: string): Promise<void> {
    await game.loadBoard(id)

    if (game.state !== null) {
        await navigateTo(roomRoute('lobby'))
    }
}

async function hostOnline(id: string): Promise<void> {
    const room = createRoomResultSchema.parse(
        await $fetch('/api/rooms', { method: 'POST', body: { gameId: id } }),
    )

    // The token is the host's only claim to the room, including after a reload (Q1e).
    rememberHostToken(room.code, room.hostToken)

    await navigateTo(roomRoute('lobby', room.code))
}

async function join(): Promise<void> {
    const parsed = roomCodeSchema.safeParse(joinCode.value)

    if (!parsed.success) {
        joinError.value = `A room code is ${ROOM_CODE_LENGTH} letters and digits.`

        return
    }

    joinError.value = null
    await navigateTo(joinPath(parsed.data))
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

        <form class="flex flex-wrap items-end gap-3" @submit.prevent="join">
            <div>
                <label class="block text-sm font-medium" for="join-code">Have a room code?</label>
                <input
                    id="join-code"
                    v-model="joinCode"
                    class="mt-1 w-32 rounded border border-border bg-surface px-3 py-2 uppercase tracking-widest"
                    type="text"
                    :maxlength="ROOM_CODE_LENGTH"
                    autocomplete="off"
                />
            </div>
            <UiButton type="submit" variant="secondary">Join</UiButton>
            <p v-if="joinError" class="text-sm text-muted">{{ joinError }}</p>
        </form>

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
                <div class="flex gap-2">
                    <UiButton :disabled="game.loading" @click="hostLocal(board.id)">Host</UiButton>
                    <UiButton variant="secondary" @click="hostOnline(board.id)">
                        Host online
                    </UiButton>
                </div>
            </li>
        </ul>

        <p v-if="game.error" class="text-sm text-muted">{{ game.error }}</p>
    </div>
</template>
