# Scheduler

An [Nx](https://nx.dev) monorepo for a scheduling app. Coordinators plan recurring weekly timeslots; each week's appointment tracks which members are available (available, if needed or unavailable), who is confirmed to attend, and an optional prospect. Users are coordinators, members or prospects.

- **`scheduler-ui`** is an Angular app. It currently runs against stubbed in-memory services (`AuthService`, `UserService`, `TimeslotService`) that start from seed data.
- **`scheduler-api`** is a [NestJS](https://nestjs.com) app. It is still a skeleton that serves a single greeting at `GET /api`; the UI does not call it yet.

Everything is built and tested with [Vite](https://vite.dev) and [Vitest](https://vitest.dev).

## Quick start

```bash
npm install

# Angular app on http://localhost:4200 (proxies /api to http://localhost:3000)
npx nx serve scheduler-ui

# Nest API on http://localhost:3000/api
npx nx serve scheduler-api
```

Run the same checks CI runs:

```bash
npx nx run-many -t lint test build typecheck e2e
```

Run one target for one project:

```bash
npx nx test scheduler-ui-state
npx nx typecheck scheduler-api
```

Use `npx nx affected -t <target>` to limit a run to what changed.

## Projects

| Project                             | Path                                         | Tags                                 |
| ----------------------------------- | -------------------------------------------- | ------------------------------------ |
| `scheduler-ui`                      | `apps/scheduler-ui`                          | `scope:scheduler-ui`                 |
| `scheduler-ui-e2e`                  | `apps/scheduler-ui-e2e`                      |                                      |
| `scheduler-ui-feature-auth`         | `packages/scheduler-ui/feature-auth`         | `scope:scheduler-ui`, `type:feature` |
| `scheduler-ui-feature-dashboard`    | `packages/scheduler-ui/feature-dashboard`    | `scope:scheduler-ui`, `type:feature` |
| `scheduler-ui-feature-timeslots`    | `packages/scheduler-ui/feature-timeslots`    | `scope:scheduler-ui`, `type:feature` |
| `scheduler-ui-feature-appointments` | `packages/scheduler-ui/feature-appointments` | `scope:scheduler-ui`, `type:feature` |
| `scheduler-ui-state`                | `packages/scheduler-ui/state`                | `scope:scheduler-ui`, `type:state`   |
| `scheduler-ui-data`                 | `packages/scheduler-ui/data`                 | `scope:scheduler-ui`, `type:data`    |
| `scheduler-ui-core-ui`              | `packages/scheduler-ui/core-ui`              | `scope:scheduler-ui`, `type:ui`      |
| `scheduler-ui-test-utils`           | `packages/scheduler-ui/test-utils`           | `scope:scheduler-ui`, `type:util`    |
| `scheduler-api`                     | `apps/scheduler-api`                         |                                      |
| `scheduler-api-data`                | `packages/scheduler-api/data`                |                                      |
| `scheduler-api-e2e`                 | `apps/scheduler-api-e2e`                     |                                      |
| `shared-models`                     | `packages/shared/models`                     | `scope:shared`, `type:data`          |

`packages/scheduler-ui/styles` is not a project: it holds the shared Tailwind and SCSS utilities, variables and mixins.

### Module boundaries

ESLint enforces the dependency rules from the tags (`eslint.config.mjs`):

- `scope:shared` can only depend on `scope:shared`.
- `scope:scheduler-ui` can depend on `scope:scheduler-ui` and `scope:shared`.
- `type:data` can only depend on `type:data`.

`shared-models` holds the types used by both sides (`User`, `Timeslot`, `Appointment`).

## Working in the UI

- Mock and seed data come from `@scheduler/ui/data/testing`, never from the main `@scheduler/ui/data` entry point. The app registers it with `provideSeedData()`; tests provide only the entities they need with `provideTestState(...)`.
- Specs drive components through harnesses (`*.harness.ts` next to each component) rather than `screen` or `fireEvent`; shared helpers are in `@scheduler/ui/test-utils`.
- Conventions for code, tests and test data are in [`CLAUDE.md`](CLAUDE.md), and the Angular-specific ones are in [`.claude/rules/ui-patterns.md`](.claude/rules/ui-patterns.md).

### E2E

```bash
npx playwright install   # once
npx nx e2e scheduler-ui-e2e
```

Playwright starts `scheduler-ui` itself (`BASE_URL` overrides `http://localhost:4200`).

## Working in the API

```bash
npx nx serve scheduler-api      # builds, then runs dist/main.js
npx nx build scheduler-api      # SSR build to apps/scheduler-api/dist
npx nx e2e scheduler-api-e2e    # serves the API, then runs the Vitest e2e specs against it
```

| Variable              | Used by                     | Default                 |
| --------------------- | --------------------------- | ----------------------- |
| `PORT`                | API, API e2e                | `3000`                  |
| `SCHEDULER_UI_ORIGIN` | API (the CORS origin)       | `http://localhost:4200` |
| `HOST`                | API e2e (where it connects) | `localhost`             |

The API build emits a CommonJS bundle. Nest relies on decorator metadata, which the Vite build keeps through the `experimentalDecorators` and `emitDecoratorMetadata` options in `tsconfig`.

## Shared configuration

Per-project configs are thin wrappers around shared ones in `tools/`, so a change is made once.

**Vite and Vitest** (`tools/vite.config.base.ts`)

- `getViteBaseConfig({ dirName })` configures Node tests (the API and `shared-models`).
- `getViteAngularConfig({ dirName })` adds the Angular plugin, jsdom and the Angular test setup.
- The project name, cache directory and coverage directory are derived from the project's location, so a project's `vite.config.mts` is usually one line plus its extras (the API adds its SSR build).

**TypeScript** (`tools/tsconfig/`)

- `strict.json`, `angular.json` and `node.json` hold compiler options.
- `source.json` and `spec.json` hold the `include` and `exclude` lists (using `${configDir}`) for non-test and test code.
- Each project keeps a solution-style `tsconfig.json` that references a `tsconfig.lib.json` (or `tsconfig.app.json`) and a `tsconfig.spec.json`. Those two are one-line `extends` of the shared files.
- Harnesses, `test-utils/` and `test-setup.ts` are type-checked as specs, so they stay excluded from the lib or app config.

**Typecheck** is one workspace-wide default in `nx.json`: `tsc --build tsconfig.json --noEmit`. It checks the sources and then the specs. Build info is written to a gitignored `tmp/` folder in each project.

**API-only Nx config** lives in each API project's `project.json`: the explicit `build` target and the opt-out from the UI styles input (`"namedInputs": { "uiStyles": [] }`), so UI style changes don't invalidate API caches.

## Adding projects

Use the generators, then move the new project onto the shared configs above.

```bash
npx nx g @nx/angular:lib my-lib
npx nx g @nx/nest:lib my-api-lib
```

`npx nx list` shows installed plugins, and `npx nx list <plugin>` shows a plugin's generators.

## CI

`.github/workflows/ci.yml` checks formatting against `main` (`npx nx format:check`), then runs lint, test, build, typecheck and e2e for every project, using [Nx Cloud](https://nx.dev/nx-cloud) for caching and distribution. Fix formatting with `npx nx format:write`.

## Useful commands

```bash
npx nx graph                          # interactive project graph
npx nx show project scheduler-api     # resolved targets and config for a project
npx nx run-many -t test --parallel=3  # run a target everywhere
npx nx affected -t lint test          # only what changed
npx nx format:write                   # format the workspace
```
