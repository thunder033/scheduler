import { defineConfig } from 'vite';

import { getViteAngularConfig } from '../../tools/vite.config.base';

export default defineConfig(
  getViteAngularConfig({ dirName: import.meta.dirname }),
);
