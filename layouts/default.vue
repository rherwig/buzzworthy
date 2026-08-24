<script setup lang="ts">
// Default layout: shared page chrome.
</script>

<template>
    <div class="min-h-screen bg-background text-foreground">
        <header class="border-b border-border bg-surface">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                <span class="text-lg font-semibold">AI Boilerplate</span>
                <div class="flex items-center gap-4">
                    <span class="hidden text-sm text-muted sm:inline">Nuxt 3 · TypeScript</span>
                    <ThemeSwitcher />
                </div>
            </div>
        </header>
        <main class="mx-auto max-w-4xl px-6 py-10">
            <slot />
        </main>
    </div>
</template>
