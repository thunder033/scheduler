## General Coding Conventions
- Use named constants for literal string and numeric values; avoid magic numbers/values
  - Check for existing potential relevant constants when writing new code

## Type Conventions
- Prefer `interface` for object shapes that will be extended
- Use `type` for unions, intersections, mapped types
- Never use `any` — use `unknown` and narrow, or `never` for exhaustive checks
- Export types alongside implementations, not in separate files

## Test Conventions
- Each TypeScript file in `src` has a corresponding test file; exceptions are:
  - test files (`.spec.ts`) or test support files (`.harness.ts`, `.test-utils.ts`, or under `test-utils/`)
  - files with no logic that only list values, other config, or exports (i.e. constants)
- Use factory functions to generate test data instead of raw object definitions, especially for large and/or repeated structures
- Tests use a common, parameterized `setup` method for preparing each scenario and avoid beforeEach hooks
  - the setup method usually returns an object with test fixtures and data to use in the scenario
- Tests focus on the behavior of the module under test
  - Focus on asserting how the module responds to interactions with its public interface
  - Avoid asserting against hard-coded properties or values
- Tests drive behavior through harnesses, not screen or fireEvent. screen is only for the test scene itself, such as an "outside" button or a test-only state reader.

## Development  Flow
- NEVER use git stash or other commands that touch the index without asking.
- When using the Bash tool, ALWAYS give an explanation before the tool call of what will be done
- Prefer Read/Write tools over Bash unless there is a specific reason for Bash
- When given instructions to write code, only write was explicitly asked. Wait for review and further instructions before proceeding.
- Don't attempt to validate the functionality in the browser after edits, the dev will manually validate functionality in the browser
- Use the ts-quality skill to check code quality after edits

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
