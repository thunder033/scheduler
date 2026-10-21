import { defineConfig } from 'vitest/config';

// Named `vitest.e2e.config` so the Nx vitest plugin and the root `projects` glob
// do not pick it up as a unit-test project (these specs need a running server).
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/scheduler-api-e2e',
  test: {
    name: 'scheduler-api-e2e',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    reporters: ['default'],
    globalSetup: ['src/support/global-setup.ts'],
    setupFiles: ['src/support/test-setup.ts'],
  },
}));
