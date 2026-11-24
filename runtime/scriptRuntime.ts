import fs from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';

export type ScriptEntry = {
  fileDir: string;
  filePath: string;
  scriptKind: 'standalone' | 'directory';
};

export type EnvEntry = {
  key: string;
  value: string;
  // Relative path of the .env file the value came from, or "shell" when the shell value won
  source: string;
};

export const fileExists = async (filePath: string) =>
  fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

export const resolveScriptEntry = async ({
  rootDir,
  scriptName,
}: {
  rootDir: string;
  scriptName: string;
}): Promise<ScriptEntry | null> => {
  const standaloneEntry: ScriptEntry = {
    fileDir: 'src',
    filePath: `src/${scriptName}.ts`,
    scriptKind: 'standalone',
  };
  if (await fileExists(path.resolve(rootDir, standaloneEntry.filePath))) {
    return standaloneEntry;
  }

  const directoryEntry: ScriptEntry = {
    fileDir: `src/${scriptName}`,
    filePath: `src/${scriptName}/index.ts`,
    scriptKind: 'directory',
  };
  if (await fileExists(path.resolve(rootDir, directoryEntry.filePath))) {
    return directoryEntry;
  }

  return null;
};

export const getEnvFilePaths = ({
  rootDir,
  scriptEntry,
}: {
  rootDir: string;
  scriptEntry: ScriptEntry;
}) => {
  const envFilePaths = [path.resolve(rootDir, '.env')];
  if (scriptEntry.scriptKind === 'directory') {
    envFilePaths.push(path.resolve(rootDir, scriptEntry.fileDir, '.env'));
  }
  return envFilePaths;
};

// Loads the root .env, then the script's .env. Later files override earlier ones,
// and values already set in the shell always win.
export const loadEnvFiles = async ({
  rootDir,
  scriptEntry,
  env = process.env,
}: {
  rootDir: string;
  scriptEntry: ScriptEntry;
  env?: NodeJS.ProcessEnv;
}): Promise<EnvEntry[]> => {
  const shellKeys = new Set(Object.keys(env));
  const entries = new Map<string, EnvEntry>();

  for (const envFilePath of getEnvFilePaths({ rootDir, scriptEntry })) {
    if (!(await fileExists(envFilePath))) {
      continue;
    }

    const source = path.relative(rootDir, envFilePath);
    const parsedEnv = parseEnv(await fs.readFile(envFilePath, 'utf-8'));

    for (const [key, value = ''] of Object.entries(parsedEnv)) {
      if (shellKeys.has(key)) {
        entries.set(key, { key, value: env[key] ?? '', source: 'shell' });
        continue;
      }
      env[key] = value;
      entries.set(key, { key, value, source });
    }
  }

  return [...entries.values()].sort((a, b) => a.key.localeCompare(b.key));
};
