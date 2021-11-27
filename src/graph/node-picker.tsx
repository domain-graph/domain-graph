import './node-picker.less';

import React, { useCallback, useMemo, useState } from 'react';
import { Eye, EyeOff } from '../icons';

import { useDispatch } from '../state';
import { hideNode, showNode } from '../state/graph/graph-actions';
import { useAllNodes, useIsVisible } from '../state/graph/hooks';

export const NodePicker: React.VFC = () => {
  const nodes = useAllNodes();
  const [filter, setFilter] = useState<string>('');
  const sortedNodes = useMemo(
    () =>
      [...nodes]
        .filter(
          (node) =>
            !filter ||
            node.id.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
        )
        .sort((a, b) => a.id.localeCompare(b.id)),
    [nodes, filter],
  );

  const handleFilter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(event.target.value);
    },
    [],
  );

  return (
    <div className="c-node-picker">
      <input onChange={handleFilter} />
      <ul>
        {sortedNodes.map((node) => (
          <Item key={node.id} nodeId={node.id} />
        ))}
      </ul>
    </div>
  );
};

const Item: React.VFC<{ nodeId: string }> = ({ nodeId }) => {
  const dispatch = useDispatch();
  const isVisible = useIsVisible(nodeId);

  const handleClick = useCallback(() => {
    dispatch(isVisible ? hideNode(nodeId) : showNode(nodeId));
  }, [nodeId, isVisible, dispatch]);

  return (
    <li className={isVisible ? 'visible' : 'hidden'}>
      <button onClick={handleClick}>
        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      {nodeId}
    </li>
  );
};
