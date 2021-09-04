import './spotlight.less';

import React, { useCallback, useEffect, useState } from 'react';

import { IconButton } from '../components/icon-button';
import {
  CornerUpRight,
  EyeOff,
  Maximize2,
  Minimize2,
  Trash,
  X,
} from '../icons';
import { useSelector, useDispatch } from '../state';
import {
  deselectNode,
  hideNode,
  selectField,
} from '../state/graph/graph-actions';
import {
  useEnum,
  useEnumValues,
  useField,
  useFields,
  useNode,
} from '../state/graph/hooks';
import { deleteNode, restoreNode } from '../state/graph/nodes/actions';
import { Icons } from '..';

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
  const e = useEnum(arg.typeName);

  if (!arg) return null;

  const {
    name,
    description,
    isList,
    typeName,
    isListElementNotNull,
    isNotNull,
  } = arg;
  return (
    <li key={arg.name} className="scalar field">
      <span className="name">{name}</span>
      {': '}
      <span className="type" title={e?.description}>
        {isList && '['}
        {typeName}
        {isListElementNotNull && '!'}
        {isList && ']'}
        {isNotNull && '!'}
      </span>
      {!!description && <div className="description">{description}</div>}
      <EnumValuesInfo enumId={typeName} />
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
  const isDeleted = useNode(nodeId)?.isDeleted;

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
    dispatch(isDeleted ? restoreNode(nodeId) : deleteNode(nodeId));
  }, [dispatch, isDeleted, nodeId]);

  return (
    <div className="controls">
      {/* <IconButton
        Icon={isDeleted ? CornerUpRight : Trash}
        size={size}
        onClick={handleDeleteClick}
      /> */}
      {/* <IconButton Icon={EyeOff} size={size} onClick={handleHideClick} /> */}
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
  const node = useNode(nodeId);

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
      {!!node?.current.description && (
        <div>
          {node.current.description}
          {node?.current?.description === node?.original?.description
            ? null
            : ' (edited)'}
        </div>
      )}
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
  const field = useField(fieldId)?.current;
  if (!field) return null;
  const { name, description } = field;
  return (
    <li className="id field">
      <div className="name">{name}</div>
      {!!description && <div className="description">{description}</div>}
    </li>
  );
};

const EdgeField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const dispatch = useDispatch();
  const field = useField(fieldId)?.current;

  const handleClick = useCallback(() => {
    dispatch(selectField(fieldId));
  }, [fieldId, dispatch]);

  const { selectedFieldId } = useSelector((state) => state.graph);

  const isSelected = selectedFieldId === fieldId;

  if (!field) return null;
  const {
    name,
    description,
    isList,
    typeName,
    isListElementNotNull,
    isNotNull,
  } = field;

  return (
    <li
      className={isSelected ? 'selected edge field' : 'edge field'}
      onClick={handleClick}
      role="button"
    >
      <span className="name">{name}</span>
      {': '}
      <span className="type">
        {isList && '['}
        {typeName}
        {isListElementNotNull && '!'}
        {isList && ']'}
        {isNotNull && '!'}
      </span>
      <div className="description">{!!description ? description : null}</div>
    </li>
  );
};

const ScalarField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const {
    name,
    description,
    typeName,
    isNotNull,
    isList,
    isListElementNotNull,
  } = useSelector((state) => state.graph.fields[fieldId]);
  const e = useEnum(typeName);
  return (
    <li className="scalar field">
      <div>
        <span className="name">{name}</span>
        {': '}
        <span className="type" title={e?.description}>
          {isList && '['}
          {typeName}
          {isListElementNotNull && '!'}
          {isList && ']'}
          {isNotNull && '!'}
        </span>
      </div>
      <div className="description">{!!description ? description : null}</div>
      <EnumValuesInfo enumId={typeName} />
    </li>
  );
};

const EnumValuesInfo: React.VFC<{ enumId: string }> = ({ enumId }) => {
  const e = useEnum(enumId);
  const values = useEnumValues(enumId);

  if (!e) return null;

  return (
    <ul className="enum-values">
      {values.map((value) => (
        <li
          key={value.id}
          className={
            value.isDeprecated ? 'deprecated enum-value' : 'enum-value'
          }
        >
          <span className="name">{value.name}</span>
          {!!value.description && (
            <span className="description">: {value.description}</span>
          )}
          {!!value.isDeprecated && !!value.deprecationReason && (
            <div className="notice">⚠️ {value.deprecationReason}</div>
          )}
        </li>
      ))}
    </ul>
  );
};
