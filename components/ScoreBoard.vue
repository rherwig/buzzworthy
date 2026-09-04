<script setup lang="ts">
import { isSeatOccupied, type Seat } from '~~/shared/game'

/**
 * Live scores. Highlights the seat that currently holds the buzz.
 *
 * `compact` is the form shown *inside* the open-clue view: an open clue lives in a modal,
 * which hides the rest of the page from assistive tech, so the scores have to travel into
 * the dialog rather than stay behind it (docs/JEOPARDY.md M4).
 */
const props = defineProps<{
    seats: readonly Seat[]
    activeSeatIndex?: number | null
    compact?: boolean
}>()

const players = computed(() => props.seats.filter(isSeatOccupied))
</script>

<template>
    <ul class="flex flex-wrap justify-center gap-2 sm:gap-3" aria-label="Scores">
        <li
            v-for="seat in players"
            :key="seat.index"
            class="rounded-lg border bg-surface text-center"
            :class="[
                compact ? 'min-w-20 flex-1 px-2 py-1' : 'min-w-32 flex-1 p-4',
                seat.index === activeSeatIndex
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border',
            ]"
        >
            <p class="truncate font-medium" :class="compact ? 'text-xs' : 'text-sm'">
                {{ seat.name }}
            </p>
            <p
                class="font-bold"
                :class="[compact ? 'text-lg' : 'text-2xl', seat.score < 0 ? 'text-red-500' : '']"
            >
                {{ seat.score }}
            </p>
            <p v-if="!compact" class="text-xs uppercase text-muted">
                {{ seat.kind === 'local' ? `Local · key ${seat.index + 1}` : 'Online' }}
            </p>
        </li>
    </ul>
</template>
