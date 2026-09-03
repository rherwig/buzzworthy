<script setup lang="ts">
import { MAX_SEATS, MIN_SEATS, type SeatKind } from '~~/shared/game'
import { UiButton } from '~/shared/ui'

/**
 * Seat setup, RTS-lobby style: every seat is `Local`, `Open` or `Closed`.
 * `Open` seats can already be configured, but nobody can claim one until the
 * realtime room lands in M3 — the reducer refuses to start such a lobby.
 */
const game = useGameStore()
const router = useRouter()

const seatKinds: { value: SeatKind; label: string }[] = [
    { value: 'local', label: 'Local' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
]

// The lobby only exists in memory, so a direct visit or a refresh has nothing to show.
onMounted(() => {
    if (game.state === null) {
        void router.replace('/')
    }
})

function start(): void {
    game.startGame()

    if (game.phase !== 'lobby') {
        void router.push('/play')
    }
}
</script>

<template>
    <div v-if="game.state" class="space-y-8">
        <div>
            <h1 class="text-3xl font-bold">Lobby</h1>
            <p class="mt-2 text-muted">{{ game.board?.title }}</p>
        </div>

        <div class="flex items-center gap-3">
            <label class="text-sm font-medium" for="seat-count">Seats</label>
            <input
                id="seat-count"
                class="w-20 rounded border border-border bg-surface px-2 py-1"
                type="number"
                :min="MIN_SEATS"
                :max="MAX_SEATS"
                :value="game.seats.length"
                @change="game.setSeatCount(Number(($event.target as HTMLInputElement).value))"
            />
        </div>

        <ul class="space-y-3">
            <li
                v-for="seat in game.seats"
                :key="seat.index"
                class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4"
            >
                <span class="w-16 text-sm font-semibold text-muted">Seat {{ seat.index + 1 }}</span>

                <input
                    class="flex-1 rounded border border-border bg-background px-3 py-2 disabled:opacity-50"
                    type="text"
                    :value="seat.name ?? ''"
                    :placeholder="seat.kind === 'open' ? 'Waiting for a player…' : 'Name'"
                    :disabled="seat.kind !== 'local'"
                    :aria-label="`Name of seat ${seat.index + 1}`"
                    @input="game.renameSeat(seat.index, ($event.target as HTMLInputElement).value)"
                />

                <div class="flex gap-1">
                    <UiButton
                        v-for="kind in seatKinds"
                        :key="kind.value"
                        size="sm"
                        :variant="seat.kind === kind.value ? 'primary' : 'secondary'"
                        @click="game.setSeatKind(seat.index, kind.value)"
                    >
                        {{ kind.label }}
                    </UiButton>
                </div>
            </li>
        </ul>

        <div class="flex items-center gap-4">
            <UiButton :disabled="!game.canStart" @click="start">Start game</UiButton>
            <p v-if="game.setupError" class="text-sm text-muted">{{ game.setupError }}</p>
        </div>
    </div>
</template>
