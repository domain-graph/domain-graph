import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { format } from 'prettier';
import { GraphFactory } from './factory';
import { interospectionHeuristic } from './factory/heuristics/introspection';
import { connectionHeuristic } from './factory/heuristics/relay-connection';

import { Field, SpecificFieldType, Schema } from './types';

const schema: Schema = JSON.parse(
  readFileSync(join('data', 'schema.json')).toString(),
);

const factory = new GraphFactory(connectionHeuristic, interospectionHeuristic);

const { nodes, edges } = factory.build(schema);

const myData = {
  nodes,
  edges,
};

writeFileSync(
  join('data', 'nodes.json'),
  format(JSON.stringify(myData.nodes), { parser: 'json' }),
);
writeFileSync(
  join('data', 'links.json'),
  format(JSON.stringify(myData.edges), { parser: 'json' }),
);

function getFieldType(
  field: Field,
): {
  plurality: 'single' | 'array';
  type: SpecificFieldType;
  optional: boolean;
} {
  let t = field.type;

  let foundList = false;

  const optional = t.kind !== 'NON_NULL';

  do {
    switch (t.kind) {
      case 'LIST':
        t = t.ofType;
        foundList = true;
        break;
      case 'NON_NULL':
        t = t.ofType;
        break;
      default:
        return { plurality: foundList ? 'array' : 'single', type: t, optional };
    }
  } while (true);
}
