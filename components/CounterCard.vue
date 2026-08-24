<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

// Example component: Pinia state + a Headless UI accessible primitive.
const counter = useCounterStore()
</script>

<template>
    <section class="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 class="mb-4 text-xl font-semibold">Pinia counter</h2>

        <div class="flex items-center gap-4">
            <button
                class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                type="button"
                @click="counter.increment"
            >
                Increment
            </button>
            <button
                class="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-background"
                type="button"
                @click="counter.reset"
            >
                Reset
            </button>
            <p class="text-sm">
                count: <strong>{{ counter.count }}</strong> · doubled:
                <strong>{{ counter.doubled }}</strong>
            </p>
        </div>

        <Disclosure v-slot="{ open }" as="div" class="mt-6">
            <DisclosureButton class="text-sm font-medium text-muted underline underline-offset-2">
                {{ open ? 'Hide' : 'Show' }} details (Headless UI)
            </DisclosureButton>
            <DisclosurePanel class="mt-2 text-sm text-muted">
                This card demonstrates Pinia state and a Headless UI Disclosure primitive, styled
                with Tailwind.
            </DisclosurePanel>
        </Disclosure>
    </section>
</template>
