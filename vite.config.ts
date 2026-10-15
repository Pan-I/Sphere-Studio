import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        // e2e/ holds the Playwright browser tests, which run with `npm run test:e2e` instead.
        exclude: [...configDefaults.exclude, 'e2e/**'],
    },
})
