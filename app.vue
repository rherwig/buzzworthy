<script setup lang="ts">
// Root component. Renders the active layout + page.
useHead({
    title: 'AI Boilerplate',
    meta: [{ name: 'description', content: 'Nuxt 3 + TypeScript enterprise template' }],
})
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>
