import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Mirrors the tsconfig path aliases so tests can import app modules.
 * Run with `npm test` (vitest is a devDependency; CI runs it on every storefront PR).
 */
export default defineConfig({
  test: {
    // Some older tests use Jest-style globals (describe/it without imports).
    globals: true,
    // lib/env.ts requires this at import time; tests never call the real API.
    env: { NEXT_PUBLIC_API_BASE_URL: 'http://api.test.invalid/api' },
  },
  resolve: {
    alias: {
      '@profixer/marketing-data': fileURLToPath(new URL('./lib/marketing-data/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
