import './search-box.less';

import React, { useCallback, useRef, useState } from 'react';
import { useSearch } from '.';
import { useDebouncedCallback } from './use-debounced-callback';
import {
  useArg,
  useEnum,
  useField,
  useInput,
  useNode,
} from '../state/graph/hooks';
import { TypeDisplayName } from '../graph/spotlight';
import { useDispatch } from '../state';
import { selectField, selectNode } from '../state/graph/graph-actions';
import { IconButton } from '../components/icon-button';
import { Icons } from '..';

export const SearchBox: React.VFC = () => {
  const search = useSearch();
  const [results, setResults] = useState<ReturnType<typeof search> | null>(
    null,
  );

  const [query, setQuery] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log('Search', event.target.value);
      if (event.target.value) {
        setResults(search(event.target.value));
      } else {
        setResults(null);
      }
    },
    [search],
  );

  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    setResults(null);
    setQuery(null);
  }, []);

  const debouncedSearch = useDebouncedCallback(handleSearch, 500);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      debouncedSearch(event);
    },
    [debouncedSearch],
  );

  return (
    <div className="c-search-box">
      <div className="controls">
        <input placeholder="Search" ref={inputRef} onChange={handleChange} />
        <IconButton
          Icon={!!query ? Icons.X : Icons.Search}
          size={16}
          onClick={handleClear}
        />
      </div>
      {results !== null && !results.length && 'No results found'}
      {!!results?.length && (
        <ol>
          {results?.map((result) => (
            <SearchResult resultRef={result.ref} />
          ))}
        </ol>
      )}
    </div>
  );
};

const SearchResult: React.VFC<{ resultRef: string }> = ({ resultRef }) => {
  const [kind, id] = resultRef.split(':');

  switch (kind) {
    case 'Node':
      return <NodeResult id={id} />;
    case 'Field':
      return <FieldResult id={id} />;
    case 'Arg':
      return <ArgResult id={id} />;
    default:
      return null;
  }
};

const NodeResult: React.VFC<{ id: string }> = ({ id }) => {
  const dispatch = useDispatch();

  const node = useNode(id)?.current;

  const handleClick = useCallback(() => {
    dispatch(selectNode(node?.id || ''));
  }, [node, dispatch]);

  if (!node) return null;
  return (
    <li className="node result" role="button" onClick={handleClick}>
      <div className="name">{node.id}</div>
      <div className="description">{node.description}</div>
    </li>
  );
};

const FieldResult: React.VFC<{ id: string }> = ({ id }) => {
  const dispatch = useDispatch();

  const field = useField(id)?.current;
  const node = useNode(field?.nodeId || '')?.current;
  const e = useEnum(field?.typeName || '');
  const input = useInput(field?.typeName || '');

  const resultKind =
    field?.typeKind === 'ENUM' || field?.typeKind === 'SCALAR'
      ? 'node'
      : 'field';

  const handleClick = useCallback(() => {
    if (resultKind === 'node') {
      dispatch(selectNode(node?.id || ''));
    } else {
      dispatch(selectField(field?.id || ''));
    }
  }, [field, node, resultKind, dispatch]);

  if (!field || !node) return null;
  return (
    <li className={`${resultKind} result`} role="button" onClick={handleClick}>
      <div className="name">{node.id}</div>
      <div className="name">
        {field.name}
        {': '}
        <TypeDisplayName
          typeName={field.typeName}
          typeDescription={e?.description || input?.description}
          isList={field.isList}
          isNotNull={field.isNotNull}
          isListElementNotNull={field.isListElementNotNull}
        />
      </div>

      <div className="description">{field.description}</div>
    </li>
  );
};

const ArgResult: React.VFC<{ id: string }> = ({ id }) => {
  const dispatch = useDispatch();

  const arg = useArg(id)?.current;
  const field = useField(arg?.fieldId || '')?.current;
  const node = useNode(field?.nodeId || '')?.current;
  const e = useEnum(arg?.typeName || '');
  const input = useInput(arg?.typeName || '');

  const handleClick = useCallback(() => {
    dispatch(selectField(field?.id || ''));
  }, [field, dispatch]);

  if (!field || !node || !arg) return null;

  return (
    <li className="arg result" role="button" onClick={handleClick}>
      <div>{node.id}</div>
      <div>
        {field.name}({arg.name}:{' '}
        <TypeDisplayName
          typeName={arg.typeName}
          typeDescription={e?.description || input?.description}
          isList={arg.isList}
          isNotNull={arg.isNotNull}
          isListElementNotNull={arg.isListElementNotNull}
        />
        )
      </div>

      <div className="description">{arg.description}</div>
    </li>
  );
};
