# Scripts collection

Small TypeScript scripts kept in one place: file processing, data conversion, quick POCs. Runs on Node 24 through [nub](https://nubjs.com/).

## Setup

```sh
nub install
nub run start help
```

`node_modules` is installed locally, not linked to nub's global store, so `du -sh node_modules` shows its real size.

## Commands

| Command | Purpose |
| --- | --- |
| `nub run start help` | List scripts with their descriptions |
| `nub run start <script> [args...]` | Run `src/<script>.ts` or `src/<script>/index.ts` (`default` when omitted) |
| `nub run start:watch <script> [args...]` | Rerun the script on file changes |
| `nub run generate <script>` | Create `src/<script>/index.ts` |
| `nub run check` | Biome lint, typecheck and tests |
| `nub run format` | Format with Biome |

## Writing a script

```ts
/** One-line description, shown by `nub run start help` */
import type { Arguments, Context } from '../../runtime';

export default async (args: Arguments, context: Context) => {
  // ...
};
```

`nub run start foo input.tsv -v --limit=10 -- --raw` passes:

```json5
{ _: ['input.tsv'], v: true, limit: 10, '--': ['--raw'] }
```

If the script exports a zod `schema`, the runner parses the arguments with it first.

`context` holds `rootDir`, `scriptDir` (the script's directory) and `env` (the variables loaded from `.env` files).

## Environment and secrets

The runner loads the root `.env`, then `src/<script>/.env` for directory scripts. The script's file overrides the root one, and values already set in the shell always win.

Before the script starts, the runner prints every loaded variable with the file it came from. Values that look like secrets are shown as a fingerprint, for example `sk-p…(51) #3fa2c1`: the first 4 characters (only for values of 16+ characters), the length, and a short sha256 hash. That is enough to see which key is loaded and whether it changed.

All secret-looking values in the environment, including ones set in the shell, are also replaced with their fingerprint in everything the script writes to stdout and stderr, including their URL-encoded and base64 forms. Masking does not cover files the script writes, child processes that inherit the terminal, or values shorter than 6 characters.

A value counts as a secret when its key looks like one (`*_API_KEY`, `*_TOKEN`, `*PASSWORD*`, ...) or the value looks like a token. Keys named as public (`*_CLIENT_ID`, `*_PUBLIC_KEY`, ...) are never masked. See `runtime/secrets.ts`.

## Data

Keep script data in the script's directory. `cache/`, `output/` and `private/` directories inside a script are gitignored; put personal input data in `private/`.
