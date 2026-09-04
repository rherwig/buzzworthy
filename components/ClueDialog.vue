<script setup lang="ts">
import { clueSolution, isSeatOccupied, type Seat, type StateClue } from '~~/shared/game'
import { UiButton, UiModal } from '~/ui'

/**
 * The open clue, as the host sees it: the prompt, the buzzers and — once a seat has
 * buzzed — the solution plus the correct/wrong adjudication.
 *
 * Answers are spoken out loud (docs/JEOPARDY.md Q1f), so there is no answer input.
 * This is the host view only: a player device gets `BuzzerPanel` instead, so the two
 * roles no longer share one template.
 *
 * The scores are repeated inside the dialog: a modal hides the page behind it from
 * assistive tech, so the board's scoreboard is unreachable while a clue is open.
 */
const props = defineProps<{
    clue: StateClue
    seats: readonly Seat[]
    activeSeat: Seat | null
    lockedSeatIndexes: readonly number[]
    /** Accepted Daily Double wager: it replaces the clue value and closes the buzzers. */
    wager?: number | null
}>()

const emit = defineEmits<{
    buzz: [seatIndex: number]
    adjudicate: [correct: boolean]
    close: []
}>()

const solution = computed(() => clueSolution(props.clue))

const buzzers = computed(() =>
    props.seats
        .filter(isSeatOccupied)
        .map((seat) => ({ seat, locked: props.lockedSeatIndexes.includes(seat.index) })),
)
</script>

<template>
    <UiModal :open="true" size="xl" :dismissible="false" @close="emit('close')">
        <template #title>
            <span class="text-muted">{{ wager ?? clue.value }}</span>
            <span v-if="clue.isDailyDouble" class="ml-2 text-primary">Daily Double</span>
        </template>

        <p class="text-center text-xl font-semibold sm:text-3xl">{{ clue.prompt }}</p>

        <p v-if="activeSeat" class="mt-6 text-center" aria-live="polite">
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

        <ScoreBoard class="mt-8" compact :seats="seats" :active-seat-index="activeSeat?.index" />

        <template #footer>
            <template v-if="activeSeat">
                <UiButton variant="secondary" @click="emit('adjudicate', false)">Wrong</UiButton>
                <UiButton @click="emit('adjudicate', true)">Correct</UiButton>
            </template>
            <UiButton v-else variant="ghost" @click="emit('close')">No one buzzed</UiButton>
        </template>
    </UiModal>
</template>
