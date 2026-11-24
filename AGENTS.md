# Scripts collection

Small TypeScript scripts (file processing, data conversion, POCs), kept so they can be found and rerun later.

## Layout

- `src/<name>/index.ts`: one directory per script, with its readme, fixtures, and helpers. Use `src/<name>.ts` only for a script that is a single file.
- `src/utils/`: pure utilities used by more than one script. One-off helpers stay in the script's directory.
- `runtime/`: the runner (arguments, `.env` loading, secret masking, `help`).
- Gitignored per script: `cache/`, `output/`, and `private/` for personal input data.

## Writing a script

- Run `nub run start help` first; extend a matching script instead of adding a duplicate.
- Create scripts with `nub run generate <name>`. The entry starts with a one-line `/** description */` (shown by `help`) and default-exports `async (args: Arguments, context: Context)`. Export a zod `schema` to validate arguments.
- Resolve paths from `context.scriptDir`, not the current directory.
- If the script takes arguments or input files, add a `readme.md` with an example command.
- Secrets go in `.env` or `src/<name>/.env`, never in code. Never print secrets: the runner masks known values in output, not in written files or child processes.

## Tooling

Use nub: `nub run start <name> [args]`, `nub run start:watch <name>`, `nubx <tool>`, `nub add <pkg>`. Keep `bun.lock`; nub maintains it. `node_modules` stays local (`enableGlobalVirtualStore=false` in `.npmrc`).

After changes run `nub run check` (Biome lint, typecheck, Vitest). Tests are `*.test.ts` next to the code. Scripts listed in `exclude` in `tsconfig.json` are not typechecked; remove a script from that list when you fix it.

## Code style

- Strict TypeScript; avoid `any`. Follow `biome.json`. `camelCase` file names.
- Keep the data flow visible in the script's `index.ts`. Prefer some repetition over helper layers; every abstraction needs a concrete reason.

## Commits

Commit each new or changed script separately with a short capitalized subject (`Added budget import`). Never commit secrets or `cache/`, `output/`, `private/`.
