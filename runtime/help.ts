import fs from 'node:fs';
import path from 'node:path';

type RunnableScript = {
  name: string;
  entryPath: string;
  description: string | null;
  hasReadme: boolean;
};

// The description is the `/** ... */` comment that starts the entry file
export const readScriptDescription = (source: string) => {
  const comment = source.match(/^\s*\/\*\*([\s\S]*?)\*\//);
  if (!comment) return null;
  const description = comment[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*?\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
  return description || null;
};

const getRunnableScripts = (rootDir: string): RunnableScript[] => {
  const srcDir = path.resolve(rootDir, 'src');
  const scripts = new Map<string, RunnableScript>();

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    // Directories starting with "__" are templates, not scripts
    if (entry.name.startsWith('__')) continue;

    const isStandalone =
      entry.isFile()
      && entry.name.endsWith('.ts')
      && !entry.name.endsWith('.test.ts');
    const scriptName = isStandalone ? entry.name.slice(0, -3) : entry.name;
    const entryPath = isStandalone
      ? `src/${entry.name}`
      : `src/${entry.name}/index.ts`;

    if (!(isStandalone || entry.isDirectory())) continue;
    if (!fs.existsSync(path.resolve(rootDir, entryPath))) continue;
    // Standalone files win over directories with the same name, as in resolveScriptEntry
    if (scripts.has(scriptName) && !isStandalone) continue;

    const scriptDir = path.resolve(srcDir, entry.name);
    scripts.set(scriptName, {
      name: scriptName,
      entryPath,
      description: readScriptDescription(
        fs.readFileSync(path.resolve(rootDir, entryPath), 'utf-8')
      ),
      hasReadme:
        !isStandalone
        && ['readme.md', 'README.md', 'readme'].some(fileName =>
          fs.existsSync(path.resolve(scriptDir, fileName))
        ),
    });
  }

  return [...scripts.values()].sort((a, b) => {
    if (a.name === 'default') return -1;
    if (b.name === 'default') return 1;
    return a.name.localeCompare(b.name);
  });
};

export const help = (rootDir: string) => {
  const scripts = getRunnableScripts(rootDir);
  const nameWidth = Math.max(...scripts.map(({ name }) => name.length));

  console.log(
    [
      'Usage',
      '  nub run start [<script>] [args...]   runs src/<script>.ts or src/<script>/index.ts ("default" when omitted)',
      '  nub run start:watch <script> [args...]',
      '  nub run generate <script>           creates src/<script>/index.ts',
      '',
      'Env: the root .env, then src/<script>/.env, are loaded; shell values win.',
      'Values that look like secrets are masked in all script output.',
      '',
      `Scripts (${scripts.length}, [readme] = has src/<script>/readme.md)`,
      ...scripts.map(
        ({ name, description, hasReadme }) =>
          `  ${name.padEnd(nameWidth)}  ${description ?? '(no description)'}${hasReadme ? ' [readme]' : ''}`
      ),
    ].join('\n')
  );
};
