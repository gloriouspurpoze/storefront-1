import { fileURLToPath } from 'node:url'

/**
 * Mirrors the tsconfig path aliases so tests can import app modules.
 * Plain object (no `vitest/config` import): vitest is run via `npx vitest`, not a devDependency.
 */
export default {
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
}
