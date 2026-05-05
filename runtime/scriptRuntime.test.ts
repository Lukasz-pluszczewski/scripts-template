import { afterEach, describe, expect, it } from 'bun:test';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  loadEnvFiles,
  resolveScriptEntry,
  type ScriptEntry,
} from './scriptRuntime';

const tempDirs: string[] = [];

const createTempRoot = async () => {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'scripts-collection-runtime-')
  );
  tempDirs.push(tempDir);
  return tempDir;
};

const writeFile = async (filePath: string, content = '') => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
};

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map(tempDir => fs.rm(tempDir, { recursive: true, force: true }))
  );
});

describe('resolveScriptEntry', () => {
  it('prefers standalone scripts over directory scripts', async () => {
    const rootDir = await createTempRoot();
    await writeFile(path.join(rootDir, 'src/index-foo.ts'));
    await writeFile(path.join(rootDir, 'src/foo/index.ts'));

    const scriptEntry = await resolveScriptEntry({
      rootDir,
      scriptName: 'foo',
    });

    expect(scriptEntry).toEqual({
      fileName: 'index-foo.ts',
      fileDir: 'src',
      filePath: 'src/index-foo.ts',
      filePathForImport: './index-foo.ts',
      scriptKind: 'standalone',
    });
  });
});

describe('loadEnvFiles', () => {
  const createDirectoryScriptEntry = (): ScriptEntry => ({
    fileName: 'index.ts',
    fileDir: 'src/foo',
    filePath: 'src/foo/index.ts',
    filePathForImport: './foo/index.ts',
    scriptKind: 'directory',
  });

  const createStandaloneScriptEntry = (): ScriptEntry => ({
    fileName: 'index-foo.ts',
    fileDir: 'src',
    filePath: 'src/index-foo.ts',
    filePathForImport: './index-foo.ts',
    scriptKind: 'standalone',
  });

  it('loads root env for standalone scripts', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;
    await writeFile(path.join(rootDir, '.env'), 'ROOT_ONLY=root\n');

    await loadEnvFiles({
      rootDir,
      scriptEntry: createStandaloneScriptEntry(),
      env,
    });

    expect(env).toEqual({
      ROOT_ONLY: 'root',
    });
  });

  it('loads root env first and lets script env override it', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;
    await writeFile(
      path.join(rootDir, '.env'),
      'SHARED=root\nROOT_ONLY=root\n'
    );
    await writeFile(
      path.join(rootDir, 'src/foo/.env'),
      'SHARED=script\nSCRIPT_ONLY=script\n'
    );

    await loadEnvFiles({
      rootDir,
      scriptEntry: createDirectoryScriptEntry(),
      env,
    });

    expect(env).toEqual({
      ROOT_ONLY: 'root',
      SCRIPT_ONLY: 'script',
      SHARED: 'script',
    });
  });

  it('preserves shell environment values', async () => {
    const rootDir = await createTempRoot();
    const env = {
      SHARED: 'shell',
    } as NodeJS.ProcessEnv;
    await writeFile(
      path.join(rootDir, '.env'),
      'SHARED=root\nROOT_ONLY=root\n'
    );
    await writeFile(path.join(rootDir, 'src/foo/.env'), 'SHARED=script\n');

    await loadEnvFiles({
      rootDir,
      scriptEntry: createDirectoryScriptEntry(),
      env,
    });

    expect(env).toEqual({
      ROOT_ONLY: 'root',
      SHARED: 'shell',
    });
  });

  it('skips the second env layer for standalone scripts', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;
    await writeFile(path.join(rootDir, '.env'), 'ROOT_ONLY=root\n');
    await writeFile(path.join(rootDir, 'src/.env'), 'SRC_ONLY=src\n');

    await loadEnvFiles({
      rootDir,
      scriptEntry: createStandaloneScriptEntry(),
      env,
    });

    expect(env).toEqual({
      ROOT_ONLY: 'root',
    });
  });

  it('does not fail when env files are missing', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;

    await loadEnvFiles({
      rootDir,
      scriptEntry: createDirectoryScriptEntry(),
      env,
    });

    expect(env).toEqual({});
  });
});
