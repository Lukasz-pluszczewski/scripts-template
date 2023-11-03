import getArgs from 'yargs-parser';
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
  const fileName = `index-${scriptName}.ts`;
  const filePath = `./${fileName}`;

  const fileExists = await fs.access(path.resolve(__dirname, filePath))
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    console.error(`Tried to run the script ${fileName} but file does not exist`);
    return;
  }

  console.log('Running script', fileName);
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
