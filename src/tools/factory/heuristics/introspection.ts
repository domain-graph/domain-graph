import { TypeHeuristic } from '../types';

export const interospectionHeuristic: TypeHeuristic = (type, schema) => {
  return {
    heuristicName: 'introspecion',
    forceList: false,
    canonicalType: null,
    ignoredTypes: schema.data.__schema.types.filter(({ name }) =>
      name.startsWith('__'),
    ),
  };
};
