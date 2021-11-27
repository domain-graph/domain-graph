import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'graphql';
import { join } from 'path';
import { factory } from '../factory';
import { connections } from '../plugins/connections';
import { format } from 'prettier';

const example = readFileSync(
  join('src', 'tools', 'snapshot', 'example.graphql'),
).toString();

const document = parse(example);

const snapshot = JSON.stringify(factory(document, [connections]));

const formatted = format(snapshot, { parser: 'json' });

writeFileSync(join('src', 'tools', 'snapshot', 'snapshot.json'), formatted);
