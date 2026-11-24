import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
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

const directoryScriptEntry: ScriptEntry = {
  fileDir: 'src/foo',
  filePath: 'src/foo/index.ts',
  scriptKind: 'directory',
};

const standaloneScriptEntry: ScriptEntry = {
  fileDir: 'src',
  filePath: 'src/foo.ts',
  scriptKind: 'standalone',
};

describe('resolveScriptEntry', () => {
  it('prefers standalone scripts over directory scripts', async () => {
    const rootDir = await createTempRoot();
    await writeFile(path.join(rootDir, 'src/foo.ts'));
    await writeFile(path.join(rootDir, 'src/foo/index.ts'));

    expect(await resolveScriptEntry({ rootDir, scriptName: 'foo' })).toEqual(
      standaloneScriptEntry
    );
  });

  it('resolves directory scripts', async () => {
    const rootDir = await createTempRoot();
    await writeFile(path.join(rootDir, 'src/foo/index.ts'));

    expect(await resolveScriptEntry({ rootDir, scriptName: 'foo' })).toEqual(
      directoryScriptEntry
    );
  });

  it('returns null for missing scripts', async () => {
    const rootDir = await createTempRoot();

    expect(await resolveScriptEntry({ rootDir, scriptName: 'foo' })).toBe(null);
  });
});

describe('loadEnvFiles', () => {
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

    const entries = await loadEnvFiles({
      rootDir,
      scriptEntry: directoryScriptEntry,
      env,
    });

    expect(env).toEqual({
      ROOT_ONLY: 'root',
      SCRIPT_ONLY: 'script',
      SHARED: 'script',
    });
    expect(entries).toEqual([
      { key: 'ROOT_ONLY', value: 'root', source: '.env' },
      { key: 'SCRIPT_ONLY', value: 'script', source: 'src/foo/.env' },
      { key: 'SHARED', value: 'script', source: 'src/foo/.env' },
    ]);
  });

  it('keeps shell values and reports them as coming from the shell', async () => {
    const rootDir = await createTempRoot();
    const env = { SHARED: 'shell' } as NodeJS.ProcessEnv;
    await writeFile(path.join(rootDir, '.env'), 'SHARED=root\n');
    await writeFile(path.join(rootDir, 'src/foo/.env'), 'SHARED=script\n');

    const entries = await loadEnvFiles({
      rootDir,
      scriptEntry: directoryScriptEntry,
      env,
    });

    expect(env).toEqual({ SHARED: 'shell' });
    expect(entries).toEqual([
      { key: 'SHARED', value: 'shell', source: 'shell' },
    ]);
  });

  it('loads only the root env for standalone scripts', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;
    await writeFile(path.join(rootDir, '.env'), 'ROOT_ONLY=root\n');
    await writeFile(path.join(rootDir, 'src/.env'), 'SRC_ONLY=src\n');

    await loadEnvFiles({ rootDir, scriptEntry: standaloneScriptEntry, env });

    expect(env).toEqual({ ROOT_ONLY: 'root' });
  });

  it('does not fail when env files are missing', async () => {
    const rootDir = await createTempRoot();
    const env = {} as NodeJS.ProcessEnv;

    expect(
      await loadEnvFiles({ rootDir, scriptEntry: directoryScriptEntry, env })
    ).toEqual([]);
    expect(env).toEqual({});
  });
});
