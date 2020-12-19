import React, { useMemo } from 'react';
import { IntrospectionQuery } from 'graphql';

import { GraphFactory } from './tools/factory';
import { connectionHeuristic } from './tools/factory/heuristics/relay-connection';
import { interospectionHeuristic } from './tools/factory/heuristics/introspection';

import { Graph } from './graph';

export interface DomainGraphProps {
  introspection: IntrospectionQuery;
}

export const DomainGraph: React.VFC<DomainGraphProps> = ({ introspection }) => {
  const { nodes, edges } = useMemo(
    () =>
      new GraphFactory(connectionHeuristic, interospectionHeuristic).build(
        introspection,
      ),
    [introspection],
  );
  return <Graph nodes={nodes} edges={edges} />;
};
