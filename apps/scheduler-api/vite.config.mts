import { defineConfig } from 'vite';

import { getViteBaseConfig } from '../../tools/vite.config.base';

const NODE_TARGET = 'node22';
const BUILD_OUT_DIR = 'dist';
const BUILD_ENTRY = 'src/main.ts';
const BUILD_ENTRY_FILE_NAME = 'main.js';

export default defineConfig({
  ...getViteBaseConfig({ dirName: import.meta.dirname }),
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
});
