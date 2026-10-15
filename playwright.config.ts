import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const CI = !!process.env.CI

// Browser tests run against the built site (`npm run build`, then `vite preview`), so they check
// what Vercel serves. See e2e/ and "Browser tests" in the README.
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: CI, // a stray test.only fails CI instead of skipping everything else
    retries: CI ? 1 : 0,
    reporter: CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure', // a step-by-step recording of any test that fails
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /phone\.spec/ },
        // A touch-only phone: no keyboard shortcuts or full screen, swipes instead.
        { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /phone\.spec/ },
    ],
    webServer: {
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI,
        timeout: 180_000,
    },
})
