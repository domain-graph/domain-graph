import './node-picker.less';

import React, { useCallback, useMemo, useState } from 'react';
import { deindex } from 'flux-standard-functions';
import { Eye, EyeOff } from '../icons';

import { useDispatch, useSelector } from '../state';
import {
  hideAllNodes,
  hideNode,
  hideUnpinnedNodes,
  showNode,
} from '../state/graph/graph-actions';

export const NodePicker: React.VFC = () => {
  const dispatch = useDispatch();

  const handleHideAll = useCallback(() => {
    dispatch(hideAllNodes() as any); // TODO: (issue: #40)
  }, [dispatch]);

  const handleHideUnpinned = useCallback(() => {
    dispatch(hideUnpinnedNodes() as any); // TODO: (issue: #40)
  }, [dispatch]);

  const nodes = useSelector((state) => deindex(state.graph.nodes));
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
      <button onClick={handleHideAll}>Hide all</button>
      <button onClick={handleHideUnpinned}>Hide unpinned</button>
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
  const isVisible = useSelector((state) => !!state.graph.visibleNodes[nodeId]);

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
