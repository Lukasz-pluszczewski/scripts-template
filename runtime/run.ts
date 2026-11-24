import path from 'node:path';
import { pathToFileURL } from 'node:url';
import getArgs from 'yargs-parser';
import { help } from './help';
import type { Context } from './index';
import {
  type EnvEntry,
  loadEnvFiles,
  resolveScriptEntry,
} from './scriptRuntime';
import { createSecretMasker, fingerprintSecret, isSecret } from './secrets';

const maskStreamOutput = (
  stream: NodeJS.WriteStream,
  mask: (text: string) => string
) => {
  const write = stream.write.bind(stream) as (...args: unknown[]) => boolean;
  stream.write = ((chunk: unknown, ...rest: unknown[]) => {
    if (typeof chunk === 'string') {
      return write(mask(chunk), ...rest);
    }
    if (chunk instanceof Uint8Array) {
      // Keep binary output untouched unless it contains a secret
      const text = Buffer.from(chunk).toString('utf8');
      const maskedText = mask(text);
      return write(maskedText === text ? chunk : maskedText, ...rest);
    }
    return write(chunk, ...rest);
  }) as typeof stream.write;
};

const formatEnvSummary = (envEntries: EnvEntry[]) => {
  if (envEntries.length === 0) {
    return 'Env: no variables loaded from .env files';
  }

  const keyWidth = Math.max(...envEntries.map(({ key }) => key.length));
  const lines = envEntries.map(({ key, value, source }) => {
    const shownValue = isSecret(key, value)
      ? fingerprintSecret(value)
      : JSON.stringify(value.length > 80 ? `${value.slice(0, 77)}...` : value);
    return `  ${key.padEnd(keyWidth)}  ${shownValue}  (${source})`;
  });
  return ['Env:', ...lines].join('\n');
};

// `nub run start -- foo` passes the leading "--" through
const args = getArgs(
  process.argv.slice(2).filter((arg, index) => arg !== '--' || index),
  { configuration: { 'populate--': true } }
);
const main = async () => {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const scriptName = typeof args._[0] === 'string' ? args._[0] : 'default';

  if (scriptName === 'help') {
    help(rootDir);
    return;
  }

  const scriptEntry = await resolveScriptEntry({ rootDir, scriptName });
  if (!scriptEntry) {
    console.error(
      `Script "${scriptName}" not found: neither src/${scriptName}.ts nor src/${scriptName}/index.ts exists. Run "nub run start help" to list scripts.`
    );
    process.exitCode = 1;
    return;
  }

  const envEntries = await loadEnvFiles({ rootDir, scriptEntry });

  // Mask every secret-looking value in the environment, including shell-provided ones
  const secretValues = Object.entries(process.env).flatMap(([key, value]) =>
    value && isSecret(key, value) ? [value] : []
  );
  const maskSecrets = createSecretMasker(secretValues);
  maskStreamOutput(process.stdout, maskSecrets);
  maskStreamOutput(process.stderr, maskSecrets);
  // Node prints uncaught errors without going through process.stderr.write,
  // so print them here to mask them. Exits with 1, as Node does by default.
  const printAndExit = (error: unknown) => {
    console.error(error);
    process.exit(1);
  };
  process.on('uncaughtException', printAndExit);
  process.on('unhandledRejection', printAndExit);

  // Runner output goes to stderr, so a script's stdout can be piped
  console.error(`Running ${scriptEntry.filePath}`);
  console.error(formatEnvSummary(envEntries));
  console.error('');

  try {
    const scriptModule = await import(
      pathToFileURL(path.resolve(rootDir, scriptEntry.filePath)).href
    );

    if (typeof scriptModule.default !== 'function') {
      console.error(
        `${scriptEntry.filePath} has no default export function; only its top-level code ran.`
      );
    } else {
      const scriptArguments = { ...args, _: args._.slice(1) };
      const context: Context = {
        rootDir,
        scriptDir: path.resolve(rootDir, scriptEntry.fileDir),
        env: Object.fromEntries(
          envEntries.map(({ key, value }) => [key, value])
        ),
      };
      await scriptModule.default(
        scriptModule.schema
          ? scriptModule.schema.parse(scriptArguments)
          : scriptArguments,
        context
      );
    }
  } catch (error) {
    // Printed here for the same reason as printAndExit
    console.error(error);
    process.exitCode = 1;
  }
};

await main();
