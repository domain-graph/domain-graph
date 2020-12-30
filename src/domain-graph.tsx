import React, { useEffect, useState } from 'react';
import { IntrospectionQuery } from 'graphql';
import { Provider as StoreProvider } from 'react-redux';
import { Graph } from './graph';
import { StateRepository } from './graph-state';
import { ApplicationStore, getStore } from './state/store';

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
  const [store, setStore] = useState<ApplicationStore>();

  useEffect(() => {
    getStore(graphId, introspection, stateRepository).then(setStore);
  }, [graphId, introspection, stateRepository]);

  if (!store) return null;

  return (
    <StoreProvider store={store}>
      <Graph id={graphId} />
    </StoreProvider>
  );
};
