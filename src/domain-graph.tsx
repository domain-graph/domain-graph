import { Schema } from './tools/types';
import React, { useMemo } from 'react';
import { GraphFactory } from './tools/factory';
import { connectionHeuristic } from './tools/factory/heuristics/relay-connection';
import { interospectionHeuristic } from './tools/factory/heuristics/introspection';

import { Graph } from './graph';

export interface DomainGraphProps {
  schema: Schema;
}

export const DomainGraph: React.VFC<DomainGraphProps> = ({ schema }) => {
  const { nodes, edges } = useMemo(
    () =>
      new GraphFactory(connectionHeuristic, interospectionHeuristic).build(
        schema,
      ),
    [schema],
  );
  return <Graph nodes={nodes} edges={edges} />;
};
