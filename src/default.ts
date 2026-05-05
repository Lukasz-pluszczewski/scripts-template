import type { Arguments, Context } from '../runtime';

export default async (params: Arguments, context: Context) => {
  console.log('Running default with params:', params, context);
};
