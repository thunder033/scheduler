import { defineConfig } from 'vite';

import { getViteBaseConfig } from '../../../tools/vite.config.base';

const base = getViteBaseConfig({ dirName: import.meta.dirname });

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    // The models are plain types, so there is nothing to test
    passWithNoTests: true,
  },
});
