import React, { useEffect, useRef, useState } from 'react';
import { DocumentNode } from 'graphql';
import { Provider as StoreProvider } from 'react-redux';
import { Graph } from './graph';
import { ApplicationStore, getStore } from './state/store';
import { SaveState, SaveStateRepository } from './persistence';
import { importSaveState } from './state/graph/graph-actions';
import { SubscribedStateRepository } from './persistence/subscribed-state-repository';
import { useIndexBuilder } from './search';

export interface DomainGraphProps {
  graphId: string;
  documentNode: DocumentNode;
  repository: SaveStateRepository;
  saveState?: SaveState;
  onSaveState?(graphId: string, saveState: SaveState): void;
}

export const DomainGraph: React.VFC<DomainGraphProps> = ({
  graphId,
  documentNode,
  repository,
  saveState,
  onSaveState,
}) => {
  const saveStateRef = useRef<SaveState | undefined>(saveState);
  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  const [store, setStore] = useState<ApplicationStore>();
  const [subscribedRepository, setSubscribedRepository] =
    useState<SaveStateRepository>(
      onSaveState
        ? new SubscribedStateRepository(repository, onSaveState)
        : repository,
    );
  useEffect(() => {
    setSubscribedRepository(
      onSaveState
        ? new SubscribedStateRepository(repository, onSaveState)
        : repository,
    );
  }, [repository, onSaveState]);

  const buildIndex = useIndexBuilder();

  useEffect(() => {
    let unsubscribe = () => {
      // noop
    };
    getStore(
      graphId,
      documentNode,
      subscribedRepository,
      saveStateRef.current,
    ).then((result) => {
      setStore(result.store);
      unsubscribe = result.unsubscribe;
      buildIndex(result.store.getState());
    });

    return () => {
      unsubscribe();
    };
  }, [graphId, documentNode, subscribedRepository, buildIndex]);

  useEffect(() => {
    if (saveState) store?.dispatch(importSaveState(saveState));
  }, [saveState, store]);

  if (!store) return null;

  return (
    <StoreProvider store={store}>
      <Graph />
    </StoreProvider>
  );
};
