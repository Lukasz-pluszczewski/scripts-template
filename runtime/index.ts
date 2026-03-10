import path from 'path';
import getArgs from 'yargs-parser';
import { help } from './help';
import { loadEnvFiles, resolveScriptEntry } from './scriptRuntime';

export type { Arguments } from 'yargs-parser';
const args = getArgs(
  process.argv.slice(2).filter((arg, index) => arg !== '--' || index),
  {
    configuration: {
      'populate--': true,
    },
  }
);

(async () => {
  const rootDir = path.resolve('./');
  const scriptName = typeof args._[0] === 'string' ? args._[0] : 'default';
  console.log('scriptName', rootDir, scriptName);
  if (!scriptName) {
    console.log('Please provide a script name');
    return;
  }

  // Built-in scripts
  if (scriptName === 'help') {
    help();
    return;
  }

  const scriptEntry = await resolveScriptEntry({ rootDir, scriptName });
  if (!scriptEntry) {
    console.error(
      `Tried to run the script ${scriptName} but neither "src/${scriptName}.ts" nor "src/${scriptName}/index.ts" exists`
    );
    return;
  }

  const { fileDir, filePath, filePathForImport } = scriptEntry;

  console.log('Running script', filePath);
  console.log('');

  const loadedEnvs = await loadEnvFiles({ rootDir, scriptEntry });

  const module = await import(filePathForImport);

  if (typeof module.default === 'function') {
    const functionArguments = {
      ...args,
      _: args._.slice(1),
    };
    const parsedArguments = module.schema
      ? module.schema.parse(functionArguments)
      : functionArguments;
    await module.default(parsedArguments, {
      rootDir,
      scriptDir: path.resolve(rootDir, fileDir),
      env: loadedEnvs,
    });
  }
})();

export type Context = {
  rootDir: string;
  scriptDir: string;
  env: Record<string, string>;
};
