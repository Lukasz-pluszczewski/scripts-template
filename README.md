# Scripts
> Script runner for fast prototyping

### Run the given script
To run the index-foo.ts file:
```bash
bun start foo
```

### Run the default script
To run the index-default.ts file
```bash
bun start
```

### Run the script with arguments and options
To run the index-foo.ts file with arguments:
```bash
bun start foo -- argument -a -b --arg1=foo --arg2=bar -- --arg3=foobar
```

If index-foo.ts file exports a function like this:
```typescript
export default async (args) => {
  // ...
};
```

its args param will be:
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

### Usage with node
If you use node instead of [bun](https://bun.sh/), replace `bun start` with `npm run start-node` and run the following first:

```shell
npm i dotenv
npm i --save-dev ts-node typescript
```
