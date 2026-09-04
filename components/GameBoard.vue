<script setup lang="ts">
import type { StateCategory } from '~~/shared/game'

/**
 * The category × value grid. Presentational: it renders what it is given and asks
 * the parent to open a clue — the reducer decides whether that is allowed.
 *
 * Five columns cannot shrink below readability, so on a narrow screen the grid keeps a
 * minimum width and scrolls sideways instead of squeezing the values into nothing.
 */
const props = defineProps<{
    categories: readonly StateCategory[]
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
    <div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
            class="grid min-w-[34rem] gap-1 sm:gap-2"
            :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
        >
            <div
                v-for="category in columns"
                :key="category.id"
                class="rounded border border-border bg-surface px-2 py-3 text-center text-xs font-semibold uppercase sm:text-sm"
            >
                {{ category.title }}
            </div>

            <template v-for="(category, column) in columns" :key="`clues-${category.id}`">
                <button
                    v-for="clue in category.clues"
                    :key="clue.id"
                    type="button"
                    class="aspect-[3/2] rounded border border-border text-xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:text-2xl"
                    :class="
                        isRevealed(clue.id)
                            ? 'bg-background text-muted/40'
                            : 'bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-60'
                    "
                    :style="{ gridColumn: column + 1, gridRow: clue.position + 2 }"
                    :disabled="disabled || isRevealed(clue.id)"
                    :aria-label="
                        isRevealed(clue.id)
                            ? `${category.title} for ${clue.value}, already played`
                            : `${category.title} for ${clue.value}`
                    "
                    @click="emit('select', clue.id)"
                >
                    {{ isRevealed(clue.id) ? '' : clue.value }}
                </button>
            </template>
        </div>
    </div>
</template>
