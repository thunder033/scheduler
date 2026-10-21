/// <reference types='vitest' />
import { defineConfig } from 'vite';

const NODE_TARGET = 'node22';
const BUILD_OUT_DIR = 'dist';
const BUILD_ENTRY = 'src/main.ts';
const BUILD_ENTRY_FILE_NAME = 'main.js';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/scheduler-api',
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: BUILD_OUT_DIR,
    emptyOutDir: true,
    target: NODE_TARGET,
    ssr: true,
    sourcemap: true,
    rollupOptions: {
      input: BUILD_ENTRY,
      output: {
        entryFileNames: BUILD_ENTRY_FILE_NAME,
        format: 'cjs' as const,
      },
    },
  },
  test: {
    name: 'scheduler-api',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/scheduler-api',
      provider: 'v8' as const,
    },
  },
}));
