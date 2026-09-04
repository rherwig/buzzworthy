<script setup lang="ts">
import {
    ROOM_CODE_LENGTH,
    createRoomResultSchema,
    joinPath,
    roomRoute,
    roomCodeSchema,
} from '~~/shared/game'
import { gameSummaryListSchema, type GameSummary } from '~~/shared/types/game'
import { APP_NAME, APP_TAGLINE } from '~~/shared/branding'
import { UiButton } from '~/ui'

/**
 * Board picker and front door.
 *
 * Hosting is one action: every game is a server-authoritative room with a code and a
 * join link (docs/JEOPARDY.md §7). Whether it is a pure hotseat, a purely remote game
 * or a mix is decided per seat in the lobby, not here — a game with no `Open` seat
 * simply never uses its code. Players arrive here too, with a code in hand.
 */
const { data: boards, error } = await useFetch('/api/games', {
    transform: (payload): GameSummary[] => gameSummaryListSchema.parse(payload),
})

// The front door carries the product name, so it is the one page without its own title.
useHead({ title: '' })

const joinCode = ref('')
const joinError = ref<string | null>(null)

const hosting = ref(false)
const hostError = ref<string | null>(null)

async function host(id: string): Promise<void> {
    hosting.value = true
    hostError.value = null

    try {
        const room = createRoomResultSchema.parse(
            await $fetch('/api/rooms', { method: 'POST', body: { gameId: id } }),
        )

        // The token is the host's only claim to the room, including after a reload (Q1e).
        rememberHostToken(room.code, room.hostToken)

        await navigateTo(roomRoute('lobby', room.code))
    } catch {
        hostError.value = 'Could not open a room. Is the server running?'
    } finally {
        hosting.value = false
    }
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
            <h1 class="text-3xl font-bold">{{ APP_NAME }}</h1>
            <p class="mt-1 text-lg text-muted">{{ APP_TAGLINE }}</p>
            <p class="mt-3 text-muted">
                Pick a board, then set up the seats. Local players share this screen; open a seat
                and hand out the room code, and that player joins from their own device.
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
                <UiButton :disabled="hosting" @click="host(board.id)">Host</UiButton>
            </li>
        </ul>

        <p v-if="hostError" class="text-sm text-muted">{{ hostError }}</p>
    </div>
</template>
