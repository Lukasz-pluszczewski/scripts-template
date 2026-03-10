# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` is the runtime dispatcher. It resolves scripts in this order: `src/index-<name>.ts`, then `src/<name>/index.ts`.
- `src/index-default.ts` is the fallback entrypoint when no script name is provided.
- Prefer `src/<scriptName>/index.ts` for anything beyond a trivial one-file script. Keep script-specific assets, fixtures, scratch output, and `readme.md` files inside that same directory.
- Use `src/index-<name>.ts` only for small standalone scripts that do not need supporting files.
- Put reusable cross-script utilities in `src/utils`. Keep one-off helpers inside the owning script directory instead of promoting them prematurely.
- `generate.ts` scaffolds a new script directory at `src/<name>/index.ts`; use that pattern when adding new scripts.
- If a script needs special config or isolated tooling, keep it self-contained inside its own `src/<scriptName>/` directory, following the existing examples.


Service example pattern:
```ts
export type MultiplyService = ReturnType<typeof createMultiplyService>;
export const createMultiplyService = () => ({
  multiply: (a: number, b: number) => a * b,
});

export type ExampleService = ReturnType<typeof createExampleService>;
export const createExampleService = ({
  multiplyService,
}: {
  multiplyService: MultiplyService;
}) => ({
  handleExample: (a: number, b: number) => multiplyService.multiply(a, b),
});
```

## Build, Test, and Development Commands
- `bun install` installs dependencies.
- `bun start` runs the default script via `src/index-default.ts`.
- `bun start <script> [args...]` runs `src/index-<script>.ts` or `src/<script>/index.ts`.
- `bun run start:watch -- <script> [args...]` reruns the selected script on file changes.
- `bun test` runs the Bun test suite (`*.test.ts` files).
- `bun run generate -- <script-name>` creates a new `src/<script-name>/index.ts` scaffold.
- `npm run start-node -- <script> [args...]` is the Node/`ts-node` fallback when Bun is not being used.
- `bunx prettier --write <paths>` formats touched files using the repo Prettier config when needed.

## Architectural guidelines
- Avoid unnecessary abstractions: keep modules simple, focused, and single responsibility
- Always respect established patterns if asked or pointed to explicitly.
- Explicit orchestration over indirection: route/service code should clearly show the data flow.
- Anti-abstraction bias for transformation code: avoid “helper layers” that hide response shaping.
- Strict legacy isolation: backward compatibility is preserved, but legacy terms/fields are not allowed to leak into V2.
- Consistency across code, tests, docs, and Bruno collections is required, not optional.
- Favor readability and local clarity over generic DRY abstractions, especially those that perpetuate legacy architecture.
- Avoid unnecessary abstraction – each abstraction must have a good reason to exist. Prefer verbosity over multiplying abstractions.

## Coding Style & Naming Conventions
- Use TypeScript with strict typing; avoid `any` unless unavoidable.
- Formatting is enforced by Prettier (`.prettierrc.mjs`): single quotes, trailing commas (es5), sorted imports.
- Use 2-space indentation (Prettier default).
- Utilities and helpers use `camelCase` filenames (for example, `fileCache.ts`).
- Service files follow `Feature.service.ts` naming (for example, `Example.service.ts`, `Multiply.service.ts`).

## Testing Guidelines
- Primary framework: Bun test runner (`bun:test`).
- Test files use `*.test.ts` naming (example: `src/shared/utilities/timer.test.ts`).
