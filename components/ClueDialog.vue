<script setup lang="ts">
import type { Clue } from '~~/shared/types/game'
import { isSeatOccupied, type Seat } from '~~/shared/game'
import { UiButton, UiModal } from '~/shared/ui'

/**
 * The open clue, as the host sees it: the prompt, the buzzers and — once a seat has
 * buzzed — the solution plus the correct/wrong adjudication.
 *
 * Answers are spoken out loud (docs/JEOPARDY.md Q1f), so there is no answer input.
 */
const props = defineProps<{
    clue: Clue
    seats: readonly Seat[]
    activeSeat: Seat | null
    lockedSeatIndexes: readonly number[]
}>()

const emit = defineEmits<{
    buzz: [seatIndex: number]
    adjudicate: [correct: boolean]
    close: []
}>()

const buzzers = computed(() =>
    props.seats
        .filter(isSeatOccupied)
        .map((seat) => ({ seat, locked: props.lockedSeatIndexes.includes(seat.index) })),
)
</script>

<template>
    <UiModal :open="true" size="xl" :dismissible="false" @close="emit('close')">
        <template #title>
            <span class="text-muted">{{ clue.value }}</span>
            <span v-if="clue.isDailyDouble" class="ml-2 text-primary">Daily Double</span>
        </template>

        <p class="text-center text-2xl font-semibold sm:text-3xl">{{ clue.prompt }}</p>

        <p v-if="activeSeat" class="mt-6 text-center">
            <span class="font-semibold">{{ activeSeat.name }}</span> buzzed in.
            <span class="block text-sm text-muted">Solution: {{ clue.solution }}</span>
        </p>

        <div v-else class="mt-6 flex flex-wrap justify-center gap-2">
            <UiButton
                v-for="{ seat, locked } in buzzers"
                :key="seat.index"
                variant="secondary"
                :disabled="locked"
                @click="emit('buzz', seat.index)"
            >
                {{ seat.name }}
                <span v-if="seat.kind === 'local'" class="ml-1 text-muted"
                    >({{ seat.index + 1 }})</span
                >
            </UiButton>
        </div>

        <template #footer>
            <template v-if="activeSeat">
                <UiButton variant="secondary" @click="emit('adjudicate', false)">Wrong</UiButton>
                <UiButton @click="emit('adjudicate', true)">Correct</UiButton>
            </template>
            <UiButton v-else variant="ghost" @click="emit('close')">No one buzzed</UiButton>
        </template>
    </UiModal>
</template>
