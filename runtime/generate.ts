import fs from 'node:fs';
import path from 'node:path';

const scriptName = process.argv[2];
if (!scriptName || !/^[\w-]+$/.test(scriptName)) {
  console.error(
    'Usage: nub run generate <script-name> (letters, digits, "_" and "-")'
  );
  process.exit(1);
}

const rootDir = path.resolve(import.meta.dirname, '..');
const scriptDir = path.resolve(rootDir, 'src', scriptName);
if (fs.existsSync(scriptDir) || fs.existsSync(`${scriptDir}.ts`)) {
  console.error(`Script "${scriptName}" already exists`);
  process.exit(1);
}

fs.mkdirSync(scriptDir, { recursive: true });
fs.writeFileSync(
  path.resolve(scriptDir, 'index.ts'),
  `/** TODO: one-line description, shown by \`nub run start help\` */
import type { Arguments, Context } from '../../runtime';

export default async (args: Arguments, context: Context) => {
  console.log('Running ${scriptName} with args:', args);
};
`
);
console.log(`Created src/${scriptName}/index.ts`);
