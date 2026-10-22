/// <reference types="vitest/config" />

import angular from '@analogjs/vite-plugin-angular';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

const WORKSPACE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const VITE_CACHE_DIR = 'node_modules/.vite';
const COVERAGE_DIR = 'coverage';
const PROJECT_ROOT_PREFIX = /^(apps|packages)\//;
const PATH_SEPARATOR = /\//g;
const PROJECT_NAME_SEPARATOR = '-';
const SPEC_FILE_PATTERN = 'src/**/*.spec.ts';
const ANGULAR_TEST_SETUP_FILE = 'src/test-setup.ts';

export interface ViteConfigOptions {
  /** Directory of the project's `vite.config.mts` (pass `import.meta.dirname`). */
  dirName: string;
}

const getProjectPath = (dirName: string) => relative(WORKSPACE_ROOT, dirName);

/**
 * Derives the Nx project name from its location, e.g. `packages/scheduler-ui/state` -> `scheduler-ui-state`
 * and `apps/scheduler-api` -> `scheduler-api`.
 */
const getProjectName = (projectPath: string) =>
  projectPath
    .replace(PROJECT_ROOT_PREFIX, '')
    .replace(PATH_SEPARATOR, PROJECT_NAME_SEPARATOR);

/** Shared config for projects whose tests run in Node (the API). */
export const getViteBaseConfig = ({ dirName }: ViteConfigOptions) => {
  const projectPath = getProjectPath(dirName);

  return {
    root: dirName,
    cacheDir: resolve(WORKSPACE_ROOT, VITE_CACHE_DIR, projectPath),
    plugins: [],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      name: getProjectName(projectPath),
      watch: false,
      globals: true,
      environment: 'node',
      include: [SPEC_FILE_PATTERN],
      reporters: ['default'],
      coverage: {
        reportsDirectory: resolve(WORKSPACE_ROOT, COVERAGE_DIR, projectPath),
        provider: 'v8' as const,
      },
    },
  } satisfies UserConfig;
};

/** Shared config for Angular projects, whose tests run in jsdom with the Angular test bed. */
export const getViteAngularConfig = (options: ViteConfigOptions) => {
  const base = getViteBaseConfig(options);

  return {
    ...base,
    plugins: [angular(), ...base.plugins],
    test: {
      ...base.test,
      environment: 'jsdom',
      setupFiles: [ANGULAR_TEST_SETUP_FILE],
    },
  } satisfies UserConfig;
};
