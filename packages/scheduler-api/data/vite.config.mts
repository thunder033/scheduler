import { defineConfig } from 'vite';

import { getViteBaseConfig } from '../../../tools/vite.config.base';

const base = getViteBaseConfig({ dirName: import.meta.dirname });

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    // The module declares no providers yet, so there is nothing to test
    passWithNoTests: true,
  },
});
