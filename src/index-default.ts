import { FirstArgument, SecondArgument } from './index';

export default async (params: FirstArgument, context: SecondArgument) => {
  console.log('Running default with params:', params);
};
