<script setup lang="ts">
// Landing page. Fetches server health via a composable and shows the counter.
const { data: status } = useApiStatus()
</script>

<template>
    <div class="space-y-8">
        <div>
            <h1 class="text-3xl font-bold">Welcome</h1>
            <p class="mt-2 text-muted">
                A Nuxt 3 + TypeScript template with Prisma, Pinia, Tailwind, Headless UI, Zod,
                ESLint/Prettier, Vitest and Playwright.
            </p>
        </div>

        <div class="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <h2 class="mb-2 text-xl font-semibold">Server status</h2>
            <p v-if="status" class="text-sm text-muted">
                {{ status.status }} · {{ status.environment }}
            </p>
            <p v-else class="text-sm text-muted">Loading…</p>
        </div>

        <CounterCard />
    </div>
</template>
