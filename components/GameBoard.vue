<script setup lang="ts">
import type { Category } from '~~/shared/types/game'

/**
 * The category × value grid. Presentational: it renders what it is given and asks
 * the parent to open a clue — the reducer decides whether that is allowed.
 */
const props = defineProps<{
    categories: Category[]
    revealedClueIds: readonly string[]
    /** Set while a clue is open or the room is paused, so the grid stops accepting clicks. */
    disabled?: boolean
}>()

const emit = defineEmits<{ select: [clueId: string] }>()

const columns = computed(() => [...props.categories].sort((a, b) => a.position - b.position))

function isRevealed(clueId: string): boolean {
    return props.revealedClueIds.includes(clueId)
}
</script>

<template>
    <div
        class="grid gap-2"
        :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
    >
        <div
            v-for="category in columns"
            :key="category.id"
            class="rounded border border-border bg-surface px-2 py-3 text-center text-sm font-semibold uppercase"
        >
            {{ category.title }}
        </div>

        <template v-for="(category, column) in columns" :key="`clues-${category.id}`">
            <button
                v-for="clue in category.clues"
                :key="clue.id"
                type="button"
                class="aspect-[3/2] rounded border border-border text-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
                :class="
                    isRevealed(clue.id)
                        ? 'bg-background text-muted/40'
                        : 'bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-60'
                "
                :style="{ gridColumn: column + 1, gridRow: clue.position + 2 }"
                :disabled="disabled || isRevealed(clue.id)"
                :aria-label="`${category.title} for ${clue.value}`"
                @click="emit('select', clue.id)"
            >
                {{ isRevealed(clue.id) ? '' : clue.value }}
            </button>
        </template>
    </div>
</template>
