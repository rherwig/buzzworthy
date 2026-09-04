<script setup lang="ts">
import { clueSolution, isSeatOccupied, type Seat, type StateClue } from '~~/shared/game'
import { UiButton, UiModal } from '~/shared/ui'

/**
 * The open clue, as the host sees it: the prompt, the buzzers and — once a seat has
 * buzzed — the solution plus the correct/wrong adjudication.
 *
 * Answers are spoken out loud (docs/JEOPARDY.md Q1f), so there is no answer input.
 * On a player device the clue carries no solution, so that line simply disappears, and
 * the only buzzer shown is that player's own — the host sees all local seats instead.
 */
const props = defineProps<{
    clue: StateClue
    seats: readonly Seat[]
    activeSeat: Seat | null
    lockedSeatIndexes: readonly number[]
    /** Accepted Daily Double wager: it replaces the clue value and closes the buzzers. */
    wager?: number | null
    /** Seat this device may buzz for; `null` (the host) means every occupied seat. */
    ownSeatIndex?: number | null
    /** Only the host judges answers and closes the clue. */
    canAdjudicate?: boolean
}>()

const emit = defineEmits<{
    buzz: [seatIndex: number]
    adjudicate: [correct: boolean]
    close: []
}>()

const solution = computed(() => clueSolution(props.clue))

const buzzers = computed(() =>
    props.seats
        .filter(
            (seat) =>
                isSeatOccupied(seat) &&
                (props.ownSeatIndex === null ||
                    props.ownSeatIndex === undefined ||
                    props.ownSeatIndex === seat.index),
        )
        .map((seat) => ({ seat, locked: props.lockedSeatIndexes.includes(seat.index) })),
)

const adjudicable = computed(() => props.canAdjudicate !== false)
</script>

<template>
    <UiModal :open="true" size="xl" :dismissible="false" @close="emit('close')">
        <template #title>
            <span class="text-muted">{{ wager ?? clue.value }}</span>
            <span v-if="clue.isDailyDouble" class="ml-2 text-primary">Daily Double</span>
        </template>

        <p class="text-center text-2xl font-semibold sm:text-3xl">{{ clue.prompt }}</p>

        <p v-if="activeSeat" class="mt-6 text-center">
            <span class="font-semibold">{{ activeSeat.name }}</span>
            <template v-if="wager"> wagered {{ wager }}.</template>
            <template v-else> buzzed in.</template>
            <span v-if="solution" class="block text-sm text-muted">Solution: {{ solution }}</span>
        </p>

        <div v-else class="mt-6 flex flex-wrap justify-center gap-2">
            <UiButton
                v-for="{ seat, locked } in buzzers"
                :key="seat.index"
                variant="secondary"
                :disabled="locked"
                :data-testid="`buzz-seat-${seat.index}`"
                @click="emit('buzz', seat.index)"
            >
                {{ seat.name }}
                <span v-if="seat.kind === 'local'" class="ml-1 text-muted"
                    >({{ seat.index + 1 }})</span
                >
            </UiButton>
        </div>

        <template v-if="adjudicable" #footer>
            <template v-if="activeSeat">
                <UiButton variant="secondary" @click="emit('adjudicate', false)">Wrong</UiButton>
                <UiButton @click="emit('adjudicate', true)">Correct</UiButton>
            </template>
            <UiButton v-else variant="ghost" @click="emit('close')">No one buzzed</UiButton>
        </template>
    </UiModal>
</template>
