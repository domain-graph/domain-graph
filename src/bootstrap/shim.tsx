import React, { useCallback, useMemo, useRef } from 'react';
import { OpenFilesResult, DataProvider, BrowserOpenFileDialog } from '..';

import { DomainGraph } from '../domain-graph';
import { LocalStorageStateRepository } from '../graph-state';

export const Shim: React.VFC = () => {
  const handleDrop = useCallback(async () => {
    return true;
  }, []);

  const handleShowOpenDialog = useCallback(async () => {
    return (
      openFileDialog.current?.open() ||
      Promise.resolve({ canceled: true, files: [] })
    );
  }, []);

  const openFileDialog = useRef<{ open: () => Promise<OpenFilesResult> }>(null);
  const stateRepository = useMemo(() => new LocalStorageStateRepository(), []);

  return (
    <>
      <DataProvider onDrop={handleDrop} onShowOpenDialog={handleShowOpenDialog}>
        {(introspection) => (
          <DomainGraph
            graphId="default" // TODO: add graph picker
            introspection={introspection}
            stateRepository={stateRepository}
          />
        )}
      </DataProvider>
      <BrowserOpenFileDialog
        ref={openFileDialog}
        accept=".json,.gql,.graphql"
        multiple
      />
    </>
  );
};
