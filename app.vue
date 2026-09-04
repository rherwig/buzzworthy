<script setup lang="ts">
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '~~/shared/branding'

// Root component. Renders the active layout + page, and owns the document defaults.
useHead({
    // Pages set only their own name; the product name is appended here in one place.
    titleTemplate: (title) => (title ? `${title} · ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`),
    htmlAttrs: { lang: 'en' },
})

useSeoMeta({
    description: APP_DESCRIPTION,
    ogTitle: `${APP_NAME} — ${APP_TAGLINE}`,
    ogDescription: APP_DESCRIPTION,
    ogType: 'website',
    twitterCard: 'summary',
})
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>
