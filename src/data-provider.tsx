import './data-provider.less';

import { parse as parseDocument, DocumentNode } from 'graphql';
import React, { useCallback, useState } from 'react';
import { AlertTriangle, Folder, UploadCloud } from './icons';
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
  children: (data: DocumentNode) => React.ReactElement;
}

export const DataProvider: React.VFC<DataProviderProps> = ({
  onDrop,
  children,
  onShowOpenDialog,
}) => {
  const [data, setData] = useState<DocumentNode | null>(null);

  const [dropReady, setDropReady] = useState(false);
  const [parseErrors, setParseErrors] = useState<readonly ParseError[]>([]);

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
        const { documentNode, errors } = parse(text);

        setParseErrors(errors);
        setData(documentNode);
      }
    },
    [onDrop],
  );

  const handleClickOpen = useCallback(async () => {
    setParseErrors([]);
    const result = await onShowOpenDialog?.();

    if (result && !result.canceled && result.files.length) {
      const text = result.files[0].contents;

      const { documentNode, errors } = parse(text);

      setParseErrors(errors);
      setData(documentNode);
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
      {!!parseErrors.length && (
        <ul className="errors">
          {parseErrors.map((parseError) => (
            <li key={parseError.message}>
              <AlertTriangle />
              {parseError.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type ParseError = {
  message: string;
};

function parse(str: string): {
  documentNode: DocumentNode | null;
  errors: readonly ParseError[];
} {
  const errors: ParseError[] = [];

  let documentNode: DocumentNode | null = null;

  try {
    documentNode = parseDocument(str);
  } catch (firstEx) {
    try {
      documentNode = parseDocument(str + federationSchema);
    } catch (secondEx) {
      console.error(firstEx);
      console.error(secondEx);
      return {
        documentNode: null,
        errors: [
          {
            message: 'Not a valid schema',
          },
        ],
      };
    }
  }

  return {
    documentNode,
    errors,
  };
}

// see: https://www.apollographql.com/docs/federation/federation-spec/
const federationSchema = `
scalar _FieldSet

directive @external on FIELD_DEFINITION
directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
directive @extends on OBJECT | INTERFACE
`;
