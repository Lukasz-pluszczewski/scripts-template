// Types for scripts. The runner itself is runtime/run.ts.
export type { Arguments } from 'yargs-parser';

export type Context = {
  rootDir: string;
  // Directory of the script entry: src/<name>/ for directory scripts, src/ for standalone ones
  scriptDir: string;
  // Variables loaded from .env files (shell values win over file values)
  env: Record<string, string>;
};
