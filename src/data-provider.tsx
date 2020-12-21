import './data-provider.less';

import { IntrospectionQuery } from 'graphql';
import React, { ReactNode, useCallback, useState } from 'react';
import { Folder, UploadCloud } from './icons';
import { Button } from './components/button';

export interface OpenFilesResult {
  canceled: boolean;
  files: {
    filePath: string;
    contents: string;
  }[];
}

export interface DataProviderProps {
  onShowOpenDialog?: () => Promise<OpenFilesResult>;
  onDrop?: (filename: string, contents: string) => Promise<boolean>;
  children: (data: IntrospectionQuery) => React.ReactElement;
}

export const DataProvider: React.VFC<DataProviderProps> = ({
  onDrop,
  children,
  onShowOpenDialog,
}) => {
  const [data, setData] = useState<IntrospectionQuery>();

  const [dropReady, setDropReady] = useState(false);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
    },
    [],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      // Prevent default behavior (Prevent file from being opened)
      event.preventDefault();

      const file = event.dataTransfer.files[0];

      const arrayBuffer = await file.arrayBuffer();

      const text = new TextDecoder().decode(arrayBuffer);

      if (onDrop && (await onDrop(file.name, text))) {
        setData(JSON.parse(text));
      }
    },
    [onDrop],
  );

  const handleClickOpen = useCallback(async () => {
    const result = await onShowOpenDialog?.();

    if (result && !result.canceled && result.files.length) {
      setData(JSON.parse(result.files[0].contents));
    }
  }, [onShowOpenDialog]);

  if (data) return children(data);

  return (
    <div
      className={`c-uploader${dropReady ? ' drop-ready' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={() => setDropReady(true)}
      onDragLeave={() => setDropReady(false)}
      onDrop={handleDrop}
    >
      <UploadCloud size={200} strokeWidth={8} />
      <h1>Drop a schema file here to get started!</h1>

      <p>
        To get a schema file, run the Apollo introspection query. Save the
        results and drag the file into this box.
      </p>
      {!!onShowOpenDialog && (
        <Button onClick={handleClickOpen}>
          <Folder />
          <span>Open file</span>
        </Button>
      )}
    </div>
  );
};
