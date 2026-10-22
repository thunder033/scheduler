import { defineConfig } from 'vite';

import { getViteAngularConfig } from '../../../tools/vite.config.base';

const base = getViteAngularConfig({ dirName: import.meta.dirname });

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    server: {
      deps: {
        // Material's option harnesses build their queries with their own copy of the CDK's
        // `HarnessPredicate` unless both are loaded the same way, which makes the queries empty
        inline: [/@angular\/(cdk|material)/],
      },
    },
  },
});
