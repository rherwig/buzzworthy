// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/test-utils/module'],
    css: ['~/assets/css/tailwind.css'],
    typescript: {
        strict: true,
        typeCheck: false,
    },
    eslint: {
        config: {
            stylistic: false,
        },
    },
    runtimeConfig: {
        // Server-only secrets are validated in server/utils/env.ts
        databaseUrl: process.env.DATABASE_URL,
    },
})
