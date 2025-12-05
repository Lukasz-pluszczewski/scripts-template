import getArgs from 'yargs-parser';
import { writeFileSync, mkdirSync } from 'node:fs';

export type { Arguments } from 'yargs-parser';

const args = getArgs(process.argv.slice(2).filter((arg, index) => (arg !== '--' || index)), {
  configuration: {
    'populate--': true,
  },
});

mkdirSync(`src/${args._[0]}`, { recursive: true });
writeFileSync(`src/${args._[0]}/index.ts`, `import { Arguments, Context } from './index';

export default async (params: Arguments, context: Context) => {
  console.log('Running ${args._[0]} with params:', params, context);
};
`, 'utf-8');
