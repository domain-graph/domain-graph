import './spotlight.less';

import React, { useCallback, useMemo } from 'react';

import { Edge, Node } from '../graph/types';
import { filter } from 'd3';
import {
  isEnumFieldType,
  isListFieldType,
  isScalarFieldType,
} from '../tools/types';

export interface SpotlightProps {
  source: Node | null;
  edge: Edge | null;
  target: Node | null;
  onSelectEdge(edgeId: string): void;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  source,
  edge,
  target,
  onSelectEdge,
}) => {
  if (!source) return null;

  return (
    <div className="c-spotlight">
      <NodeSpotlight {...source} onSelectEdge={onSelectEdge} />
      {edge && <EdgeSpotlight {...edge} />}
      {target && <NodeSpotlight {...target} onSelectEdge={onSelectEdge} />}
    </div>
  );
};

const EdgeSpotlight: React.FC<Edge> = ({
  name,
  description,
  args,
  heuristic,
}) => {
  return (
    <div className="edge-spotlight">
      <h1>{name}</h1>
      {heuristic && <div>({heuristic})</div>}
      {description && <div>{description}</div>}
      {!!args.length && (
        <ul>
          {args.map((arg) => (
            <li key={arg.name} className="scalar field">
              <span>{arg.name}</span>: {arg.isList && '['}
              <span>{arg.type.name}</span>
              {arg.isListElementNotNull && '!'}
              {arg.isList && ']'}
              {arg.isNotNull && '!'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const NodeSpotlight: React.FC<
  Node & {
    onSelectEdge(edgeId: string): void;
  }
> = ({ id, description, fields, onSelectEdge }) => {
  const ids = fields.filter((f) => f.type.name === 'ID');
  const scalars = fields.filter(
    (f) =>
      f.type.name !== 'ID' &&
      (isScalarFieldType(f.type) || isEnumFieldType(f.type)),
  );
  const edges = fields.filter((f) => f.edgeId);

  return (
    <div className="node-spotlight">
      <h1>{id}</h1>
      {description && <div>{description}</div>}
      <ul>
        {ids.map((field) => (
          <IdField key={field.name} {...field} />
        ))}
      </ul>
      <ul>
        {edges.map((field) => (
          <EdgeField key={field.name} onSelectEdge={onSelectEdge} {...field} />
        ))}
      </ul>
      <ul>
        {scalars.map((field) => (
          <ScalarField key={field.name} {...field} />
        ))}
      </ul>
    </div>
  );
};

const IdField: React.FC<Node['fields'][number]> = ({ name, type }) => {
  return (
    <li className="id field">
      <span>{name}</span>
    </li>
  );
};

const EdgeField: React.FC<
  Node['fields'][number] & {
    onSelectEdge(edgeId: string): void;
  }
> = ({ edgeId, name, type, onSelectEdge }) => {
  return (
    <li className="edge field">
      <button onClick={() => edgeId && onSelectEdge(edgeId)}>{name}</button>
    </li>
  );
};

const ScalarField: React.FC<Node['fields'][number]> = ({
  name,
  type,
  isNotNull,
  isList,
  isListElementNotNull,
}) => {
  return (
    <li className="scalar field">
      <span>{name}</span>: {isList && '['}
      <span>{type.name}</span>
      {isListElementNotNull && '!'}
      {isList && ']'}
      {isNotNull && '!'}
    </li>
  );
};
