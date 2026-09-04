import { defineConfig, devices } from '@playwright/test'

/**
 * Set `E2E_BASE_URL` to run the suite against an already-running target — a container or a
 * deployed instance — instead of a local dev server. Without it, Playwright starts `pnpm dev`.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const external = process.env.E2E_BASE_URL !== undefined

// https://playwright.dev/docs/test-configuration
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'html',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // A cold Nuxt dev start (empty Vite cache) can take well over two minutes.
    webServer: external
        ? undefined
        : {
              command: 'pnpm dev',
              url: baseURL,
              reuseExistingServer: true,
              timeout: 300_000,
          },
})
