<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

function handleClear(): void {
    clearError({ redirect: '/' })
}
</script>

<template>
    <div
        class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-foreground"
    >
        <h1 class="text-4xl font-bold">{{ error.statusCode }}</h1>
        <p class="text-muted">{{ error.statusMessage || 'Something went wrong' }}</p>
        <button
            class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            type="button"
            @click="handleClear"
        >
            Go home
        </button>
    </div>
</template>
