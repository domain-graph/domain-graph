import './spotlight.less';

import React, { useCallback, useEffect, useState } from 'react';

import { IconButton } from '../components/icon-button';
import { Maximize2, Minimize2, X } from '../icons';
import { useSelector, useDispatch } from '../state';
import { deselectNode, selectField } from '../state/graph/actions';
import { useFields } from '../state/graph/hooks';

export const Spotlight: React.VFC = () => {
  const sourceId = useSelector((state) => state.graph.selectedSourceNodeId);
  const fieldId = useSelector((state) => state.graph.selectedFieldId);
  const targetId = useSelector((state) => state.graph.selectedTargetNodeId);

  if (!sourceId) return null;

  return (
    <div className="c-spotlight">
      <NodeSpotlight nodeId={sourceId} />
      {fieldId && <EdgeSpotlight fieldId={fieldId} />}
      {targetId && <NodeSpotlight nodeId={targetId} />}
    </div>
  );
};

const EdgeSpotlight: React.FC<{ fieldId: string }> = ({ fieldId }) => {
  const { name, description, heuristic, argIds } = useSelector(
    (state) => state.graph.fields[fieldId],
  );
  return (
    <div className="edge-spotlight">
      <h1>{name}</h1>
      {heuristic && <div>({heuristic})</div>}
      {description && <div>{description}</div>}
      {!!argIds.length && (
        <ul>
          {argIds.map((argId) => (
            <ResolverArg key={argId} argId={argId} />
          ))}
        </ul>
      )}
    </div>
  );
};

const ResolverArg: React.VFC<{ argId: string }> = ({ argId }) => {
  const arg = useSelector((state) => state.graph.args[argId]);
  return (
    <li key={arg.name} className="scalar field">
      <span>{arg.name}</span>: {arg.isList && '['}
      <span>{arg.typeName}</span>
      {arg.isListElementNotNull && '!'}
      {arg.isList && ']'}
      {arg.isNotNull && '!'}
    </li>
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

const NodeSpotlight: React.VFC<{ nodeId: string }> = ({ nodeId }) => {
  const dispatch = useDispatch();
  const node = useSelector((state) => state.graph.nodes[nodeId]);
  const fields = useFields(nodeId);
  const ids = fields.filter((f) => f.typeName === 'ID');
  const scalars = fields.filter((f) => f.typeName !== 'ID' && !f.edgeId);
  const edges = fields.filter((f) => f.edgeId);

  const { selectedFieldId } = useSelector((state) => state.graph);

  const [isExpanded, setIsExpanded] = useState(!selectedFieldId);

  useEffect(() => {
    setIsExpanded(!selectedFieldId);
  }, [nodeId, selectedFieldId]);

  return (
    <div className="node-spotlight">
      <Controls
        isExpanded={isExpanded}
        size={16}
        onClose={() => dispatch(deselectNode(nodeId))}
        onExpand={() => setIsExpanded(true)}
        onCollapse={() => setIsExpanded(false)}
      />
      <h1>{nodeId}</h1>
      {node.description && <div>{node.description}</div>}
      {isExpanded && (
        <>
          <ul>
            {ids.map((field) => (
              <IdField key={field.id} fieldId={field.id} />
            ))}
          </ul>
          <ul>
            {edges.map((field) => (
              <EdgeField key={field.id} fieldId={field.id} />
            ))}
          </ul>
          <ul>
            {scalars.map((field) => (
              <ScalarField key={field.id} fieldId={field.id} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const IdField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const { name } = useSelector((state) => state.graph.fields[fieldId]);
  return (
    <li className="id field">
      <span>{name}</span>
    </li>
  );
};

const EdgeField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const dispatch = useDispatch();
  const { name } = useSelector((state) => state.graph.fields[fieldId]);

  const handleClick = useCallback(() => {
    dispatch(selectField(fieldId));
  }, [fieldId, dispatch]);

  return (
    <li className="edge field">
      <button onClick={handleClick}>{name}</button>
    </li>
  );
};

const ScalarField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const {
    name,
    typeName,
    isNotNull,
    isList,
    isListElementNotNull,
  } = useSelector((state) => state.graph.fields[fieldId]);
  return (
    <li className="scalar field">
      <span>{name}</span>: {isList && '['}
      <span>{typeName}</span>
      {isListElementNotNull && '!'}
      {isList && ']'}
      {isNotNull && '!'}
    </li>
  );
};
