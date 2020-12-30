import { useMemo } from 'react';
import { deindex } from 'flux-standard-functions';

import { Edge } from '.';
import { useSelector } from '..';

export function useVisibleEdges(): Edge[] {
  const { visibleNodeIds } = useSelector((state) => state.nodes);

  const allEdges = useSelector((state) => deindex(state.edges.data));

  return useMemo(() => {
    const nodeIds = new Set(visibleNodeIds);

    return allEdges.filter(
      (edge) =>
        nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId),
    );
  }, [visibleNodeIds, allEdges]);
}
