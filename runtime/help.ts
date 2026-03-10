import fs from 'fs';
import path from 'path';

type RunnableScript = {
  name: string;
  entryPath: string;
  kind: 'standalone' | 'directory';
  hasReadme: boolean;
  isDefault: boolean;
};

const getRunnableScripts = (rootDir: string): RunnableScript[] => {
  const srcDir = path.resolve(rootDir, 'src');

  if (!fs.existsSync(srcDir)) {
    return [];
  }

  const scripts = new Map<string, RunnableScript>();
  const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of srcEntries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) {
      continue;
    }

    const scriptName = entry.name.slice(0, -3);
    scripts.set(scriptName, {
      name: scriptName,
      entryPath: `src/${entry.name}`,
      kind: 'standalone',
      hasReadme: false,
      isDefault: scriptName === 'default',
    });
  }

  for (const entry of srcEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const indexPath = path.resolve(srcDir, entry.name, 'index.ts');
    if (!fs.existsSync(indexPath) || scripts.has(entry.name)) {
      continue;
    }

    const readmeMdPath = path.resolve(srcDir, entry.name, 'readme.md');
    const readmePath = path.resolve(srcDir, entry.name, 'readme');

    scripts.set(entry.name, {
      name: entry.name,
      entryPath: `src/${entry.name}/index.ts`,
      kind: 'directory',
      hasReadme: fs.existsSync(readmeMdPath) || fs.existsSync(readmePath),
      isDefault: entry.name === 'default',
    });
  }

  return Array.from(scripts.values()).sort((a, b) => {
    if (a.isDefault && !b.isDefault) {
      return -1;
    }

    if (!a.isDefault && b.isDefault) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  });
};

export const help = () => {
  const rootDir = path.resolve('./');
  const scripts = getRunnableScripts(rootDir);
  const scriptLines =
    scripts.length > 0
      ? scripts.map((script) => {
          const markers = [
            script.isDefault ? 'default' : null,
            script.kind,
            script.hasReadme ? 'readme' : null,
          ].filter(Boolean);

          return `  - ${script.name.padEnd(24)} ${script.entryPath}${
            markers.length ? ` (${markers.join(', ')})` : ''
          }`;
        })
      : ['  - No runnable scripts were found in src/.'];

  const lines = [
    'Scripts Collection Runtime Help',
    '',
    'Usage',
    '  bun start',
    '  bun start help',
    '  bun start <script> [args...]',
    '  bun run start:watch -- <script> [args...]',
    '  npm run start-node -- <script> [args...]',
    '',
    'Runtime behavior',
    `  - Current working directory is treated as the project root: ${rootDir}`,
    '  - If no script name is provided, the runtime runs `default`.',
    '  - `help` is a reserved built-in command handled by the runtime.',
    '  - The first positional argument selects the script.',
    '  - Remaining positional arguments are forwarded to the script.',
    '  - Named flags are forwarded as parsed CLI options.',
    '  - If a script exports `schema`, the runtime uses it to parse and validate arguments.',
    '  - Standalone entries in `src/` are preferred over directory entries with the same script name.',
    '  - Directory scripts are expected at `src/<script>/index.ts`.',
    '',
    'Environment loading',
    '  - `.env` in the repository root is loaded for every script.',
    '  - Directory scripts also load `src/<script>/.env`.',
    '  - Shell-provided environment variables always win.',
    '  - Script-local `.env` values override values from the root `.env`.',
    '',
    'Common commands',
    '  - `bun test` runs the Bun test suite.',
    '  - `bun run generate -- <script-name>` scaffolds `src/<script-name>/index.ts`.',
    '  - `bunx prettier --write <paths>` formats touched files with the repo Prettier config.',
    '',
    'Examples',
    '  - `bun start myFancyScript`',
    '  - `bun start otherScript foo bar --flag`',
    '  - `bun run start:watch -- myFancyScript`',
    '  - `npm run start-node -- myFancyScript`',
    '',
    `Available scripts (${scripts.length})`,
    '  - Legend: `default` = runs when no script is provided, `readme` = script has local docs.',
    ...scriptLines,
  ];

  console.log(lines.join('\n'));
};
