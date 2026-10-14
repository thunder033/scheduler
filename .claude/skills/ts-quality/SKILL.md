---
name: ts-quality
description: Enforce TypeScript quality standards after writing or modifying TypeScript code. Run type checking and linting on each changed file for instant feedback. Use after creating/editing TypeScript files, or when quality checks, typecheck, lint, or validate are mentioned.
---

# TypeScript Quality Enforcement

This skill helps maintain TypeScript code quality by running checks after each set of edits.

## What This Skill Does

When activated, this skill ensures TypeScript code meets quality standards by:

1. **Type Checking** - Runs the Nx `typecheck` target to ensure zero TypeScript type errors (app and test files)
2. **Linting** - Runs the Nx `lint` target to enforce code style consistency

## When to Use This Skill

Activate this skill:

- **After any set of modifications or writes including a .ts or .tsx file**
- After creating new TypeScript files
- After editing existing TypeScript files
- When user mentions: "quality checks", "typecheck", "lint", "validate code"
- Before creating git commits
- During code review processes

## Quality Standards

**ZERO TOLERANCE POLICY**: No lint errors or type errors are acceptable.

### Required Checks (in sequence):

1. **Type Checking**
    - Must pass with zero errors
    - Validates TypeScript type safety for the project

2. **Linting**
    - Must pass with zero errors
    - Enforces consistent code formatting and style

## Instructions

When this skill is active, follow these steps:

### 1. Announce Activation

Immediately inform the user that quality checks are running:

```
🔍 Run TypeScript quality checks...
```

### 2. Run Quality Checks

Execute checks sequentially:

```bash
# Type check every project affected by the changes
npx nx affected -t typecheck

# Lint every project affected by the changes
npx nx affected -t lint
```

To check a single project (e.g. `whiteboard-ui`) instead:

```bash
npx nx typecheck whiteboard-ui
npx nx lint whiteboard-ui
```

**Important**: Each command must succeed before the next runs. Always run checks through `nx` rather than calling `tsc` or `eslint` directly: the `typecheck` target type-checks both `tsconfig.app.json` and `tsconfig.spec.json`, and the root has no `tsconfig.json` for a bare `tsc` to use.

### 4. Report Results

**If all checks pass:**
Report success clearly:
```
✓ typecheck and lint passed
```

**If any check fails:**
- Report the specific errors for each file with line numbers
- Format: `✗ {filename}: found N errors`
- Show the actual error messages
- DO NOT proceed to subsequent checks
- DO NOT allow commits with failing checks
- Fix the errors before continuing

## Type Safety Guidelines

### DO:

- Use explicit types for function parameters and return values
- Leverage TypeScript's type inference for simple variable assignments
- Use `unknown` instead of `any` when the type is truly unknown
- Define interfaces for object shapes
- Use type guards for runtime validation of external data
- Document complex types with JSDoc comments

### DO NOT:

- Use `any` without explicit justification in comments
- Ignore TypeScript errors (no `@ts-ignore` without explanation)
- Skip typecheck before committing
- Commit code with lint errors
- Use `@ts-expect-error` to suppress valid errors
- Bypass quality checks "just this once"

## Examples

### Example 1: Creating New TypeScript File

**User**: "Create a new React component for user authentication"

**Actions**:
1. Create the file with proper types (explicit parameter and return types)
2. Avoid using `any` types
3. After file creation, immediately run quality checks:
    - Announce: `🔍 Run TypeScript quality checks...`
    - Run: `npx nx affected -t typecheck`
    - Run: `npx nx affected -t lint`
    - Report: `✓ typecheck and lint passed`
4. Only consider the task complete when checks pass

### Example 2: Modifying Existing Code

**User**: "Update the session processing logic to handle new event types"

**Actions**:
1. Make changes to the file(s) maintaining type safety
2. After changes are saved, run quality checks:
    - Announce: `🔍 Run TypeScript quality checks...`
    - Run: `npx nx affected -t typecheck`
    - Run: `npx nx affected -t lint`
    - Report results:
        - If passed: `✓ typecheck and lint passed`
        - If failed: `✗ packages/session/src/processor.ts: found 2 errors` (then show errors)

### Example 3: File with Errors

**User**: Writes a file with type errors

**Actions**:
1. Announce: `🔍 Checking src/utils/helper.ts...`
2. Run typecheck: `npx nx affected -t typecheck`
3. Detect errors and report:
   ```
   ✗ src/utils/helper.ts: found 3 errors

   src/utils/helper.ts:15:5 - error TS2322: Type 'string' is not assignable to type 'number'.
   src/utils/helper.ts:22:10 - error TS2339: Property 'foo' does not exist on type 'User'.
   src/utils/helper.ts:35:3 - error TS2345: Argument of type 'null' is not assignable to parameter of type 'string'.
   ```
4. Do NOT proceed to lint
5. Wait for user to fix errors

## Error Handling

When errors occur:

1. **Type Errors**: Show the file, line number, and error message
2. **Lint Errors**: Show the file, line number, rule violated, and how to fix

Always provide actionable information to help fix the errors.

## Best Practices

- **Fix errors immediately** - Don't accumulate technical debt
- **Type errors first** - Must be resolved before linting
- **Never commit failing code** - No exceptions
- **Pragmatic quality** - Focus on correctness, not perfection

## Requirements

This skill requires projects to have:

- **Nx** workspace with `typecheck` and `lint` targets (lint is provided by the `@nx/eslint` plugin)
- **TypeScript** and **ESLint** installed and configured

The skill uses:
- `npx nx affected -t typecheck` for type checking
- `npx nx affected -t lint` for linting