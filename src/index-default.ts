import { Arguments, Context } from './index';

export default async (params: Arguments, context: Context) => {
  console.log('Running default with params:', params, context);
};
