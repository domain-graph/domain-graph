import React, { useEffect, useMemo, useState } from 'react';
import { IntrospectionQuery } from 'graphql';

import { GraphFactory } from './tools/factory';
import { connectionHeuristic } from './tools/factory/heuristics/relay-connection';
import { interospectionHeuristic } from './tools/factory/heuristics/introspection';

import { Graph } from './graph';
import {
  GraphState,
  StateRepository,
  StateRepositoryProvider,
} from './graph-state';

export interface DomainGraphProps {
  graphId: string;
  introspection: IntrospectionQuery;
  stateRepository: StateRepository;
}

export const DomainGraph: React.VFC<DomainGraphProps> = ({
  graphId,
  introspection,
  stateRepository,
}) => {
  const { nodes, edges } = useMemo(
    () =>
      new GraphFactory(connectionHeuristic, interospectionHeuristic).build(
        introspection,
      ),
    [introspection],
  );

  const [initialState, setInitialState] = useState<GraphState>();

  useEffect(() => {
    stateRepository.get(graphId).then((state) => {
      setInitialState(
        state || {
          canvas: { x: 0, y: 0, scale: 1 },
          nodes: [],
        },
      );
    });
  }, [graphId, stateRepository]);

  return (
    <StateRepositoryProvider stateRepository={stateRepository}>
      {initialState && (
        <Graph
          id={graphId}
          initialState={initialState}
          nodes={nodes}
          edges={edges}
        />
      )}
    </StateRepositoryProvider>
  );
};
