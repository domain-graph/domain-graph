import React, { useEffect, useMemo, useState } from 'react';
import { IntrospectionQuery } from 'graphql';

import { GraphFactory } from './tools/factory';
import { connectionHeuristic } from './tools/factory/heuristics/relay-connection';
import { interospectionHeuristic } from './tools/factory/heuristics/introspection';

import { Graph } from './graph';
import { GraphState, StateRepository, StateProvider } from './graph-state';
import { StateService } from './graph-state/state-service';

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
  // NOTE: This must be a singleton service!
  const stateService = useMemo(() => new StateService(stateRepository), [
    stateRepository,
  ]);
  const [initialState, setInitialState] = useState<GraphState>();

  useEffect(() => {
    stateService
      .load(graphId)
      .then((state) => {
        if (state) {
          return Promise.resolve(state);
        } else {
          return stateService.init(graphId);
        }
      })
      .then(setInitialState);
  }, [graphId, stateService]);

  const { nodes, edges } = useMemo(
    () =>
      new GraphFactory(connectionHeuristic, interospectionHeuristic).build(
        introspection,
        initialState?.nodes || [],
      ),
    [introspection, initialState],
  );

  return (
    <StateProvider stateService={stateService}>
      {initialState && <Graph id={graphId} nodes={nodes} edges={edges} />}
    </StateProvider>
  );
};
