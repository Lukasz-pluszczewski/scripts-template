import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

export type ScriptEntry = {
  fileName: string;
  fileDir: string;
  filePath: string;
  filePathForImport: string;
  scriptKind: 'standalone' | 'directory';
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
    fileName: `${scriptName}.ts`,
    fileDir: 'src',
    filePath: `src/${scriptName}.ts`,
    filePathForImport: `../src/${scriptName}.ts`,
    scriptKind: 'standalone',
  };

  if (await fileExists(path.resolve(rootDir, standaloneEntry.filePath))) {
    return standaloneEntry;
  }

  const directoryEntry: ScriptEntry = {
    fileName: 'index.ts',
    fileDir: `src/${scriptName}`,
    filePath: `src/${scriptName}/index.ts`,
    filePathForImport: `../src/${scriptName}/index.ts`,
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

export const loadEnvFiles = async ({
  rootDir,
  scriptEntry,
  env = process.env,
}: {
  rootDir: string;
  scriptEntry: ScriptEntry;
  env?: NodeJS.ProcessEnv;
}) => {
  // Preserve shell-provided env while allowing later files to override earlier ones.
  const initialEnvKeys = new Set(Object.keys(env));

  for (const envFilePath of getEnvFilePaths({ rootDir, scriptEntry })) {
    if (!(await fileExists(envFilePath))) {
      continue;
    }

    const envFileContents = await fs.readFile(envFilePath, 'utf-8');
    const parsedEnv = dotenv.parse(envFileContents);

    for (const [key, value] of Object.entries(parsedEnv)) {
      if (initialEnvKeys.has(key)) {
        continue;
      }

      env[key] = value;
    }
  }

  return env;
};
