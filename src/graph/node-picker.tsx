import './node-picker.less';

import React, { useCallback, useMemo, useState } from 'react';
import { deindex } from 'flux-standard-functions';
import { Eye, EyeOff } from '../icons';

import { Node, nodes as nodesEntity } from '../state/nodes';
import { useDispatch, useSelector } from '../state';

import { hideAllNodes, hideUnpinnedNodes } from '../state/nodes/custom-actions';

export const NodePicker: React.VFC = () => {
  const dispatch = useDispatch();

  const handleHideAll = useCallback(() => {
    dispatch(hideAllNodes());
  }, [dispatch]);

  const handleHideUnpinned = useCallback(() => {
    dispatch(hideUnpinnedNodes());
  }, [dispatch]);

  const nodes = useSelector((state) => deindex(state.nodes.data));
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
          <Item key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
};

const Item: React.VFC<{ node: Node }> = ({ node }) => {
  const dispatch = useDispatch();

  const handleShow = useCallback(() => {
    dispatch(nodesEntity.patch(node.id, { isVisible: true }));
  }, [node.id, dispatch]);

  const { id, isVisible } = node;

  const handleClick = useCallback(() => {
    dispatch(nodesEntity.patch(id, { isVisible: !isVisible }));
  }, [id, isVisible, dispatch]);

  return (
    <li className={node.isVisible ? 'visible' : 'hidden'}>
      <button onClick={handleClick}>
        {node.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      {node.id}
    </li>
  );
};
