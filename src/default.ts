/** Prints the arguments and context it receives; runs when no script name is given */
import type { Arguments, Context } from '../runtime';

export default async (args: Arguments, context: Context) => {
  console.log('Running default with args:', args, 'and context:', context);
};
