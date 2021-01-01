import './spotlight.less';

import React, { useCallback, useEffect, useState } from 'react';

import { IconButton } from '../components/icon-button';
import { EyeOff, Maximize2, Minimize2, Trash, X } from '../icons';
import { useSelector, useDispatch } from '../state';
import {
  deselectNode,
  hideNode,
  selectField,
} from '../state/graph/graph-actions';
import { useFields } from '../state/graph/hooks';
import { deleteNode } from '../state/graph/edit-actions';

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
  nodeId: string;
  isExpanded: boolean;
  size: number;
  onExpand: () => void;
  onCollapse: () => void;
}> = ({ nodeId, isExpanded, size, onExpand, onCollapse }) => {
  const dispatch = useDispatch();

  const handleExpandClick = useCallback(() => {
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand();
    }
  }, [isExpanded, onCollapse, onExpand]);

  const handleDeselectClick = useCallback(() => {
    dispatch(deselectNode(nodeId));
  }, [dispatch, nodeId]);

  const handleHideClick = useCallback(() => {
    dispatch(hideNode(nodeId));
  }, [dispatch, nodeId]);

  const handleDeleteClick = useCallback(() => {
    dispatch(deleteNode(nodeId));
  }, [dispatch, nodeId]);

  return (
    <div className="controls">
      <IconButton Icon={Trash} size={size} onClick={handleDeleteClick} />
      <IconButton Icon={EyeOff} size={size} onClick={handleHideClick} />
      <IconButton
        Icon={isExpanded ? Minimize2 : Maximize2}
        size={size}
        onClick={handleExpandClick}
      />
      <IconButton Icon={X} size={size} onClick={handleDeselectClick} />
    </div>
  );
};

const NodeSpotlight: React.VFC<{ nodeId: string }> = ({ nodeId }) => {
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
        nodeId={nodeId}
        isExpanded={isExpanded}
        size={16}
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
