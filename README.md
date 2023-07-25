# Scripts
> Script runner for fast prototyping

### Run the given script
To run the index-foo.ts file:
```bash
npm start foo
```

### Run the default script
To run the index-default.ts file
```bash
npm start
```

### Run the script with arguments and options
To run the index-foo.ts file with arguments:
```bash
npm start foo -- argument -a -b --arg1=foo --arg2=bar -- --arg3=foobar
```

If index-foo.ts file exports a function like this:
```typescript
export default async (args) => {
  // ...
};
```

And the args param will be:
```json5
{
  _: ['argument'],
  a: true,
  b: true,
  arg1: 'foo',
  arg2: 'bar',
  '--': ['--arg3=foobar']
}
```
