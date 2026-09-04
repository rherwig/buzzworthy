<script setup lang="ts">
import { MAX_SEATS, MIN_SEATS, joinPath, type SeatKind } from '~~/shared/game'
import { UiButton } from '~/shared/ui'

/**
 * Seat setup, RTS-lobby style: every seat is `Local`, `Open` or `Closed`.
 *
 * The same screen serves a hotseat game (`/lobby`) and an online room
 * (`/lobby/ACDEF`); in the latter case the host also gets the room code and the join
 * link to hand out, and seats fill up as players claim them (docs/JEOPARDY.md §7).
 */
const game = useGameStore()
const router = useRouter()
const { code, online, link } = useRoomPage()

useHead({ title: code === null ? 'Lobby' : `Lobby ${code}` })

const seatKinds: { value: SeatKind; label: string }[] = [
    { value: 'local', label: 'Local' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
]

const inviteLink = computed(() =>
    code === null || !import.meta.client ? null : `${window.location.origin}${joinPath(code)}`,
)

// A local lobby only exists in memory, so a direct visit or a refresh has nothing to
// show. An online lobby is fetched over the socket instead.
onMounted(() => {
    if (!online && game.state === null) {
        void router.replace('/')
    }
})

// Online, the host does not decide when the screen changes — the server does.
watch(
    () => game.phase,
    (phase) => {
        if (phase !== null && phase !== 'lobby') {
            void router.push(link('play'))
        }
    },
)

function start(): void {
    game.startGame()

    if (!online && game.phase !== 'lobby') {
        void router.push(link('play'))
    }
}
</script>

<template>
    <div v-if="game.state" class="space-y-8">
        <div>
            <h1 class="text-3xl font-bold">Lobby</h1>
            <p class="mt-2 text-muted">{{ game.board?.title }}</p>
        </div>

        <div v-if="code" class="rounded-lg border border-border bg-surface p-4">
            <p class="text-sm text-muted">Room code</p>
            <p class="text-2xl font-bold tracking-widest" data-testid="room-code">{{ code }}</p>
            <p v-if="inviteLink" class="mt-2 break-all text-sm text-muted">
                Join link: <span data-testid="join-link">{{ inviteLink }}</span>
            </p>
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
                    <UiButton
                        v-if="seat.occupantId"
                        size="sm"
                        variant="ghost"
                        :aria-label="`Kick seat ${seat.index + 1}`"
                        @click="game.kickSeat(seat.index)"
                    >
                        Kick
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
