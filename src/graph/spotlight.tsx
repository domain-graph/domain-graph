import './spotlight.less';

import React, { useCallback, useEffect, useState } from 'react';

import { IconButton } from '../components/icon-button';
import { Maximize2, Minimize2, X } from '../icons';
import { useSelector, useDispatch } from '../state';
import * as customFieldActions from '../state/fields/custom-actions';
import * as customNodeActions from '../state/nodes/custom-actions';

export const Spotlight: React.VFC = () => {
  const sourceId = useSelector((state) => state.nodes.selectedSourceNodeId);
  const fieldId = useSelector((state) => state.fields.selectedFieldId);
  const targetId = useSelector((state) => state.nodes.selectedTargetNodeId);

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
  const { name, description } = useSelector(
    (state) => state.fields.data[fieldId],
  );
  return (
    <div className="edge-spotlight">
      <h1>{name}</h1>
      {/* {heuristic && <div>({heuristic})</div>} */}
      {description && <div>{description}</div>}
      {/* {!!args.length && (
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
      )} */}
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

const NodeSpotlight: React.VFC<{ nodeId: string }> = ({ nodeId }) => {
  const dispatch = useDispatch();
  const node = useSelector((state) => state.nodes.data[nodeId]);
  const fields = useSelector((state) =>
    state.fields.ix_nodeId[nodeId].fieldIds.map(
      (fieldId) => state.fields.data[fieldId],
    ),
  );
  const ids = fields.filter((f) => f.typeName === 'ID');
  const scalars = fields.filter((f) => f.typeName !== 'ID' && !f.edgeId);
  const edges = fields.filter((f) => f.edgeId);

  const { selectedFieldId } = useSelector((state) => state.fields);

  const [isExpanded, setIsExpanded] = useState(!selectedFieldId);

  useEffect(() => {
    setIsExpanded(!selectedFieldId);
  }, [nodeId, selectedFieldId]);

  return (
    <div className="node-spotlight">
      <Controls
        isExpanded={isExpanded}
        size={16}
        onClose={() => dispatch(customNodeActions.deselectNode(nodeId))}
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
  const { name } = useSelector((state) => state.fields.data[fieldId]);
  return (
    <li className="id field">
      <span>{name}</span>
    </li>
  );
};

const EdgeField: React.VFC<{ fieldId: string }> = ({ fieldId }) => {
  const dispatch = useDispatch();
  const { name } = useSelector((state) => state.fields.data[fieldId]);

  const handleClick = useCallback(() => {
    dispatch(customFieldActions.selectField(fieldId));
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
  } = useSelector((state) => state.fields.data[fieldId]);
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
