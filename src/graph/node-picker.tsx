import './node-picker.less';

import React, { useCallback, useMemo, useState } from 'react';
import EyeOff from '../icons/eye-off';
import Eye from '../icons/eye';

import { Node } from './types';

export interface NodePickerProps {
  nodes: Node[];
  onShow: (nodeId: string) => void;
  onHide: (nodeId: string) => void;
  onHideAll: () => void;
  onHideUnpinned: () => void;
}

export const NodePicker: React.FC<NodePickerProps> = ({
  nodes,
  onShow,
  onHide,
  onHideAll,
  onHideUnpinned,
}) => {
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
      <button onClick={onHideAll}>Hide all</button>
      <button onClick={onHideUnpinned}>Hide unpinned</button>
      <ul>
        {sortedNodes.map((node) => (
          <Item key={node.id} node={node} onShow={onShow} onHide={onHide} />
        ))}
      </ul>
    </div>
  );
};

interface ItemProps {
  node: Node;
  onShow: (nodeId: string) => void;
  onHide: (nodeId: string) => void;
}

const Item: React.FC<ItemProps> = ({ node, onShow, onHide }) => {
  return (
    <li className={node.isHidden ? 'hidden' : 'visible'}>
      <button
        onClick={() => (node.isHidden ? onShow(node.id) : onHide(node.id))}
      >
        {node.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      {node.id}
    </li>
  );
};
