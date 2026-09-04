<script setup lang="ts">
import type { Standing } from '~~/shared/game'

/**
 * Final standings, highest score first. Presentational: ranking (including shared
 * ranks) is decided by the `standings` selector, not here.
 */
defineProps<{ standings: readonly Standing[] }>()
</script>

<template>
    <ol class="space-y-2" aria-label="Final standings">
        <li
            v-for="entry in standings"
            :key="entry.seatIndex"
            class="flex items-center justify-between gap-4 rounded-lg border bg-surface px-4 py-3"
            :class="entry.rank === 1 ? 'border-primary' : 'border-border'"
        >
            <span class="flex items-center gap-3">
                <span class="w-6 text-sm font-semibold text-muted">{{ entry.rank }}.</span>
                <span class="font-medium">{{ entry.name }}</span>
            </span>
            <span class="text-xl font-bold" :class="entry.score < 0 ? 'text-red-500' : undefined">
                {{ entry.score }}
            </span>
        </li>
    </ol>
</template>
