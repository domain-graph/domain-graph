import './spotlight.less';

import React, { useEffect, useState } from 'react';

import { Edge, Node } from '../types';
import { isEnumFieldType, isScalarFieldType } from '../tools/types';
import { IconButton } from '../components/icon-button';
import { Maximize2, Minimize2, X } from '../icons';

export interface SpotlightProps {
  source: Node | undefined;
  edge: Edge | undefined;
  target: Node | undefined;
  onCloseNode(nodeId: string): void;
  onSelectEdge(edgeId: string): void;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  source,
  edge,
  target,
  onCloseNode,
  onSelectEdge,
}) => {
  if (!source) return null;

  return (
    <div className="c-spotlight">
      <NodeSpotlight
        {...source}
        selectedEdgeId={edge?.id}
        onClose={onCloseNode}
        onSelectEdge={onSelectEdge}
      />
      {edge && <EdgeSpotlight {...edge} />}
      {target && (
        <NodeSpotlight
          {...target}
          selectedEdgeId={edge?.id}
          onClose={onCloseNode}
          onSelectEdge={onSelectEdge}
        />
      )}
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

const Controls: React.VFC<{
  isExpanded: boolean;
  size: number;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}> = ({ isExpanded, size, onClose, onExpand, onCollapse }) => {
  return (
    <div className="controls">
      {isExpanded ? (
        <IconButton Icon={Minimize2} size={size} onClick={() => onCollapse()} />
      ) : (
        <IconButton Icon={Maximize2} size={size} onClick={() => onExpand()} />
      )}
      <IconButton Icon={X} size={size} onClick={() => onClose()} />
    </div>
  );
};

const NodeSpotlight: React.FC<
  Node & {
    selectedEdgeId: string | undefined;
    onClose(edgeId: string): void;
    onSelectEdge(edgeId: string): void;
  }
> = ({ id, description, fields, selectedEdgeId, onClose, onSelectEdge }) => {
  const ids = fields.filter((f) => f.type.name === 'ID');
  const scalars = fields.filter(
    (f) =>
      f.type.name !== 'ID' &&
      (isScalarFieldType(f.type) || isEnumFieldType(f.type)),
  );
  const edges = fields.filter((f) => f.edgeId);

  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setIsExpanded(!selectedEdgeId);
  }, [id, selectedEdgeId]);

  return (
    <div className="node-spotlight">
      <Controls
        isExpanded={isExpanded}
        size={16}
        onClose={() => onClose(id)}
        onExpand={() => setIsExpanded(true)}
        onCollapse={() => setIsExpanded(false)}
      />
      <h1>{id}</h1>
      {description && <div>{description}</div>}
      {isExpanded && (
        <>
          <ul>
            {ids.map((field) => (
              <IdField key={field.name} {...field} />
            ))}
          </ul>
          <ul>
            {edges.map((field) => (
              <EdgeField
                key={field.name}
                onSelectEdge={onSelectEdge}
                {...field}
              />
            ))}
          </ul>
          <ul>
            {scalars.map((field) => (
              <ScalarField key={field.name} {...field} />
            ))}
          </ul>
        </>
      )}
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
