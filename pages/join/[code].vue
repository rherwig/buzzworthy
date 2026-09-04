<script setup lang="ts">
import { roomRoute } from '~~/shared/game'
import { UiButton } from '~/shared/ui'

/**
 * Where an online player arrives, by link or after typing the room code (Q1c).
 *
 * No accounts (Q4): the player picks a display name and takes a free `Open` seat.
 * The anonymous occupant id behind `useRoom` is what puts them back in that seat
 * after a refresh, so a returning player skips straight to the game.
 */
const route = useRoute()
const router = useRouter()
const game = useGameStore()

const code = String(route.params.code).toUpperCase()
const { connected } = useRoom(code)
const occupantId = useOccupantId()

const name = ref('')

const openSeats = computed(() =>
    game.seats.filter((seat) => seat.kind === 'open' && seat.occupantId === null),
)
const canClaim = computed(() => name.value.trim().length > 0)

// Either the player has a seat, or the game moved on without them — both mean the
// game screen is the right place to be.
watch(
    [() => game.mySeatIndex, () => game.phase],
    ([seatIndex, phase]) => {
        if (seatIndex !== null && phase !== null && phase !== 'lobby') {
            void router.replace(roomRoute('play', code))
        }
    },
    { immediate: true },
)

function claim(seatIndex: number): void {
    game.claimSeat(seatIndex, name.value, occupantId)
}
</script>

<template>
    <div class="mx-auto max-w-md space-y-6">
        <div>
            <h1 class="text-3xl font-bold">Join room {{ code }}</h1>
            <p class="mt-2 text-muted">{{ game.board?.title ?? 'Connecting…' }}</p>
        </div>

        <div>
            <label class="block text-sm font-medium" for="player-name">Your name</label>
            <input
                id="player-name"
                v-model="name"
                class="mt-1 w-full rounded border border-border bg-surface px-3 py-2"
                type="text"
                maxlength="24"
                autocomplete="off"
            />
        </div>

        <div v-if="game.mySeat" class="rounded-lg border border-border bg-surface p-4">
            <p class="font-semibold">You are in seat {{ game.mySeat.index + 1 }}</p>
            <p class="text-sm text-muted">Waiting for the host to start the game…</p>
        </div>

        <div v-else class="space-y-2">
            <p class="text-sm text-muted">Pick a seat</p>
            <UiButton
                v-for="seat in openSeats"
                :key="seat.index"
                class="w-full"
                variant="secondary"
                :disabled="!canClaim"
                @click="claim(seat.index)"
            >
                Seat {{ seat.index + 1 }}
            </UiButton>
            <p v-if="connected && openSeats.length === 0" class="text-sm text-muted">
                No open seats right now.
            </p>
        </div>

        <p v-if="game.error" class="text-sm text-muted">{{ game.error }}</p>
    </div>
</template>
