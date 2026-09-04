<script setup lang="ts">
import { APP_NAME } from '~~/shared/branding'

/**
 * Default layout: shared page chrome.
 *
 * The bar is deliberately thin — a wordmark that doubles as the way back to the board
 * picker, plus the theme switch. Everything else about the game belongs to the page.
 */
</script>

<template>
    <div class="min-h-screen bg-background text-foreground">
        <header class="border-b border-border bg-surface">
            <div
                class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
            >
                <NuxtLink
                    class="rounded text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    to="/"
                >
                    <span aria-hidden="true" class="mr-1.5 text-primary">◉</span>{{ APP_NAME }}
                </NuxtLink>
                <ThemeSwitcher />
            </div>
        </header>
        <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <slot />
        </main>
    </div>
</template>
