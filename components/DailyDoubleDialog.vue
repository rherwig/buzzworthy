<script setup lang="ts">
import { isSeatOccupied, type Seat, type WagerBounds } from '~~/shared/game'
import { UiButton, UiModal } from '~/shared/ui'

/**
 * The wager step of a Daily Double (docs/JEOPARDY.md §6): the host says which seat
 * uncovered the clue and how much it risks. The prompt stays hidden until the wager
 * is in, so nobody can size their bet against the question.
 */
const props = defineProps<{
    seats: readonly Seat[]
    wagerSeat: Seat | null
    /** `null` until a seat is chosen — the bounds depend on that seat's score. */
    bounds: WagerBounds | null
}>()

const emit = defineEmits<{
    chooseSeat: [seatIndex: number]
    wager: [amount: number]
    close: []
}>()

const players = computed(() => props.seats.filter(isSeatOccupied))
const amount = ref<number | null>(null)

// Default to the smallest legal wager whenever the range changes.
watch(
    () => props.bounds,
    (bounds) => {
        amount.value = bounds?.min ?? null
    },
    { immediate: true },
)

const isValid = computed(
    () =>
        props.bounds !== null &&
        amount.value !== null &&
        Number.isInteger(amount.value) &&
        amount.value >= props.bounds.min &&
        amount.value <= props.bounds.max,
)

function submit(): void {
    if (isValid.value && amount.value !== null) {
        emit('wager', amount.value)
    }
}
</script>

<template>
    <UiModal :open="true" size="lg" :dismissible="false" @close="emit('close')">
        <template #title>
            <span class="text-primary">Daily Double</span>
        </template>

        <p class="text-center text-muted">Who found it?</p>

        <div class="mt-4 flex flex-wrap justify-center gap-2">
            <UiButton
                v-for="seat in players"
                :key="seat.index"
                :variant="seat.index === wagerSeat?.index ? 'primary' : 'secondary'"
                @click="emit('chooseSeat', seat.index)"
            >
                {{ seat.name }}
                <span class="ml-1 text-muted">({{ seat.score }})</span>
            </UiButton>
        </div>

        <form
            v-if="bounds"
            class="mt-6 flex items-end justify-center gap-3"
            @submit.prevent="submit"
        >
            <div>
                <label class="block text-sm font-medium" for="wager">Wager</label>
                <input
                    id="wager"
                    v-model.number="amount"
                    class="mt-1 w-32 rounded border border-border bg-background px-3 py-2"
                    type="number"
                    :min="bounds.min"
                    :max="bounds.max"
                    step="1"
                />
                <p class="mt-1 text-xs text-muted">{{ bounds.min }}–{{ bounds.max }}</p>
            </div>
            <UiButton type="submit" :disabled="!isValid">Place wager</UiButton>
        </form>

        <template #footer>
            <UiButton variant="ghost" @click="emit('close')">Skip clue</UiButton>
        </template>
    </UiModal>
</template>
