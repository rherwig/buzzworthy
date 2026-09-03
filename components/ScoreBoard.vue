<script setup lang="ts">
import { isSeatOccupied, type Seat } from '~~/shared/game'

/** Live scores. Highlights the seat that currently holds the buzz. */
const props = defineProps<{
    seats: readonly Seat[]
    activeSeatIndex?: number | null
}>()

const players = computed(() => props.seats.filter(isSeatOccupied))
</script>

<template>
    <ul class="flex flex-wrap gap-3" aria-label="Scores">
        <li
            v-for="seat in players"
            :key="seat.index"
            class="min-w-32 flex-1 rounded-lg border bg-surface p-4 text-center"
            :class="
                seat.index === activeSeatIndex
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border'
            "
        >
            <p class="truncate text-sm font-medium">{{ seat.name }}</p>
            <p class="text-2xl font-bold" :class="seat.score < 0 ? 'text-red-500' : undefined">
                {{ seat.score }}
            </p>
            <p class="text-xs uppercase text-muted">
                {{ seat.kind === 'local' ? `Local · key ${seat.index + 1}` : 'Online' }}
            </p>
        </li>
    </ul>
</template>
