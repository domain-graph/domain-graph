import React, { useEffect, useState } from 'react';
import { IntrospectionQuery } from 'graphql';
import { Provider as StoreProvider } from 'react-redux';
import { Graph } from './graph';
import { ApplicationStore, getStore } from './state/store';
import { SaveStateRepository } from './persistence';

export interface DomainGraphProps {
  graphId: string;
  introspection: IntrospectionQuery;
  repository: SaveStateRepository;
}

export const DomainGraph: React.VFC<DomainGraphProps> = ({
  graphId,
  introspection,
  repository,
}) => {
  const [store, setStore] = useState<ApplicationStore>();

  useEffect(() => {
    let unsubscribe = () => {
      // noop
    };
    getStore(graphId, introspection, repository).then((result) => {
      setStore(result.store);
      unsubscribe = result.unsubscribe;
    });

    return () => {
      unsubscribe();
    };
  }, [graphId, introspection, repository]);

  if (!store) return null;

  return (
    <StoreProvider store={store}>
      <Graph />
    </StoreProvider>
  );
};
