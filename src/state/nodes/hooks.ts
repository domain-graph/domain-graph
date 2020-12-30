import { useMemo } from 'react';

import { useSelector } from '..';
import { Node } from './index';

export function useVisibleNodeIds(): string[] {
  return useSelector((state) => state.nodes.visibleNodeIds);
}
export function useVisibleNodes(): Node[] {
  const { visibleNodeIds } = useSelector((state) => state.nodes);
  const allNodes = useSelector((state) => state.nodes.data);

  return useMemo(
    () =>
      visibleNodeIds
        .map((id) => {
          const node = allNodes[id];
          if (!node) console.error(`NO NODE FOUND FOR ID "${id}"!`);
          return node;
        })
        .filter((x) => x),
    [visibleNodeIds, allNodes],
  );
}

export function useFieldIds(nodeId: string): string[] {
  return useSelector((state) => state.fields.ix_nodeId[nodeId]?.fieldIds || []);
}
