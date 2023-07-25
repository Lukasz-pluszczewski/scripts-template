import getArgs from 'yargs-parser';
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
  console.log('Running script', fileName);
  console.log('');
  const module = await import(fileName);

  if (typeof module.default === 'function') {
    await module.default({
      ...args,
      _: args._.slice(1),
    });
  }
})();
