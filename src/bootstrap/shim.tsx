import React, { useCallback, useRef } from 'react';
import { OpenFilesResult, DataProvider, BrowserOpenFileDialog } from '..';

import { DomainGraph } from '../domain-graph';

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

  return (
    <>
      <DataProvider onDrop={handleDrop} onShowOpenDialog={handleShowOpenDialog}>
        {(introspection) => <DomainGraph introspection={introspection} />}
      </DataProvider>
      <BrowserOpenFileDialog
        ref={openFileDialog}
        accept=".json,.gql,.graphql"
        multiple
      />
    </>
  );
};
