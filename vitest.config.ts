import { defineVitestConfig } from '@nuxt/test-utils/config'

// https://nuxt.com/docs/getting-started/testing
export default defineVitestConfig({
    test: {
        environment: 'nuxt',
        // Unit/component tests live side by side with the code they cover
        // (e.g. stores/counter.test.ts). Playwright e2e specs are excluded.
        include: ['**/*.{test,spec}.ts'],
        exclude: ['**/node_modules/**', 'tests/e2e/**'],
        globals: true,
    },
})
