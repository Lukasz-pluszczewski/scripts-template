import getArgs from 'yargs-parser';
import fs from 'fs/promises';
import path from 'path';

export type { Arguments } from 'yargs-parser';

const args = getArgs(process.argv.slice(2).filter((arg, index) => (arg !== '--' || index)), {
  configuration: {
    'populate--': true,
  },
});

const fileExists = async (filePath: string) => fs.access(filePath)
  .then(() => true)
  .catch(() => false);

(async () => {
  const scriptName = args._[0] || 'default';
  if (!scriptName) {
    console.log('Please provide a script name');
    return;
  }
  const { fileName, fileDir, filePath, filePathForImport } = await (async () => {
    const fileNameRoot = `index-${scriptName}.ts`;
    const fileDirectoryRoot = `./src`;
    const filePathRoot = `${fileDirectoryRoot}/${fileNameRoot}`;
    const filePathForImportRoot = `./${fileNameRoot}`;

    const fileNameDirectory = `index.ts`;
    const fileDirectoryDirectory = `./src/${scriptName}`;
    const filePathDirectory = `${fileDirectoryDirectory}/${fileNameDirectory}`;
    const filePathForImportDirectory = `./${scriptName}/${fileNameDirectory}`;

    if (await fileExists(path.resolve(filePathRoot))) {
      return {
        fileName: fileNameRoot,
        fileDir: fileDirectoryRoot,
        filePath: filePathRoot,
        filePathForImport: filePathForImportRoot
      };
    }

    if (await fileExists(path.resolve(filePathDirectory))) {
      return {
        fileName: fileNameDirectory,
        fileDir: fileDirectoryDirectory,
        filePath: filePathDirectory,
        filePathForImport: filePathForImportDirectory
      };
    }

    console.error(`Tried to run the script ${scriptName} but neither "${filePathRoot}" nor "${filePathDirectory}" exists`);
    return { fileName: null, filePath: null };
  })();
  if (!fileName || !fileDir || !filePath) {
    return;
  }

  console.log('Running script', filePath);
  console.log('');

  const module = await import(filePathForImport);

  if (typeof module.default === 'function') {
    await module.default({
      ...args,
      _: args._.slice(1),
    }, {
      rootDir: path.resolve('./'),
      scriptDir: path.resolve(fileDir),
    });
  }
})();

export type Context = {
  rootDir: string,
  scriptDir: string,
}
