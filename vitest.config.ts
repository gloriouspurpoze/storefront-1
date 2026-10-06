import { fileURLToPath } from 'node:url'

/**
 * Mirrors the tsconfig path aliases so tests can import app modules.
 * Plain object (no `vitest/config` import): vitest is run via `npx vitest`, not a devDependency.
 */
export default {
  resolve: {
    alias: {
      '@profixer/marketing-data': fileURLToPath(new URL('../packages/marketing-data/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
}
