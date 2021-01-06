import './data-provider.less';

import {
  buildSchema,
  GraphQLSchema,
  introspectionFromSchema,
  IntrospectionQuery,
} from 'graphql';
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
  children: (data: IntrospectionQuery) => React.ReactElement;
}

export const DataProvider: React.VFC<DataProviderProps> = ({
  onDrop,
  children,
  onShowOpenDialog,
}) => {
  const [data, setData] = useState<IntrospectionQuery | null>(null);

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
        const { introspection, errors } = parse(text);

        setParseErrors(errors);
        setData(introspection);
      }
    },
    [onDrop],
  );

  const handleClickOpen = useCallback(async () => {
    setParseErrors([]);
    const result = await onShowOpenDialog?.();

    if (result && !result.canceled && result.files.length) {
      const text = result.files[0].contents;

      const { introspection, errors } = parse(text);

      setParseErrors(errors);
      setData(introspection);
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

function parse(
  str: string,
): { introspection: IntrospectionQuery | null; errors: readonly ParseError[] } {
  const errors: ParseError[] = [];
  let json: any = null;

  try {
    json = JSON.parse(str);
  } catch {
    // Parse as SDL

    let schema: GraphQLSchema | null = null;

    try {
      schema = buildSchema(str);
    } catch (firstEx) {
      try {
        schema = buildSchema(str + federationSchema);
      } catch (secondEx) {
        console.error(firstEx);
        console.error(secondEx);
        return {
          introspection: null,
          errors: [
            {
              message: 'Not a valid schema',
            },
          ],
        };
      }
    }

    const introspection = introspectionFromSchema(schema);

    return {
      introspection,
      errors: [],
    };
  }

  if (typeof json.__schema === 'object') {
    for (const prop of [
      'queryType',
      'mutationType',
      'subscriptionType',
      'types',
      'directives',
    ]) {
      if (typeof json.__schema[prop] === undefined) {
        errors.push({
          message: `Missing property "__schema.${prop}" in introspection`,
        });
      }
    }
  } else {
    errors.push({ message: 'Missing property "__schema" in introspection' });
  }

  if (errors.length) {
    return {
      introspection: null,
      errors,
    };
  } else {
    return {
      introspection: json,
      errors,
    };
  }
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
