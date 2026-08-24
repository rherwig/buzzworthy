import { defineStore } from 'pinia'

/**
 * Example Pinia store (setup syntax).
 * Use Pinia for state shared across components/pages;
 * prefer composables/`useState` for trivial local state.
 */
export const useCounterStore = defineStore('counter', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    function increment(): void {
        count.value += 1
    }

    function reset(): void {
        count.value = 0
    }

    return { count, doubled, increment, reset }
})
