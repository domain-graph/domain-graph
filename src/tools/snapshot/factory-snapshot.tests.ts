import { readFileSync } from 'fs';
import { parse } from 'graphql';
import { join } from 'path';
import { factory } from '../factory';
import { connections } from '../plugins/connections';

describe(factory, () => {
  it('recreates a valid snapshot', () => {
    // ARRANGE
    const example = readFileSync(
      join('src', 'tools', 'snapshot', 'example.graphql'),
    ).toString();
    const snapshot = JSON.parse(
      readFileSync(
        join('src', 'tools', 'snapshot', 'snapshot.json'),
      ).toString(),
    );

    const document = parse(example);

    // ACT
    const result = factory(document, [connections]);

    // ASSERT
    expect(result).toStrictEqual(snapshot);
  });
});
