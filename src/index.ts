import getArgs, { Arguments } from 'yargs-parser';
import fs from 'fs/promises';
import path from 'path';

const args = getArgs(process.argv.slice(2).filter((arg, index) => (arg !== '--' || index)), {
  configuration: {
    'populate--': true,
  },
});

(async () => {
  const scriptName = args._[0] || 'default';
  if (!scriptName) {
    console.log('Please provide a script name');
    return;
  }
  const { fileName, filePath } = await (async () => {
    const fileNameRoot = `index-${scriptName}.ts`;
    const filePathRoot = `./${fileNameRoot}`;

    const fileNameDirectory = `index.ts`;
    const filePathDirectory = `./${scriptName}/${fileNameDirectory}`;

    if (await fs.access(path.resolve(__dirname, filePathRoot)).then(() => true).catch(() => false)) {
      return { fileName: fileNameRoot, filePath: filePathRoot };
    }

    if (await fs.access(path.resolve(__dirname, filePathDirectory)).then(() => true).catch(() => false)) {
      return { fileName: fileNameDirectory, filePath: filePathDirectory };
    }

    console.error(`Tried to run the script ${scriptName} but neither "${filePathRoot}" nor "${filePathDirectory}" exists`);
    return { fileName: null, filePath: null };
  })();
  if (!fileName || !filePath) {
    return;
  }

  console.log('Running script', filePath);
  console.log('');

  const module = await import(filePath);

  if (typeof module.default === 'function') {
    await module.default({
      ...args,
      _: args._.slice(1),
    }, {
      rootPath: path.resolve('./'),
      path: path.resolve('./src'),
    });
  }
})();

export type FirstArgument = Arguments;
export type SecondArgument = {
  rootPath: string,
  path: string,
}
