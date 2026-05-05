import type { Arguments, Context } from '../../runtime';

export default async (params: Arguments, context: Context) => {
  console.log(params, context, process.env.FOO);
};
