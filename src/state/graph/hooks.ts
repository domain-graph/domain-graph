import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import * as fsf from 'flux-standard-functions';

import { Node, Edge, Field, VisibleNode } from '.';
import { useSelector } from '..';

export function useVisibleEdgeIds(): string[] {
  return useSelector((state) => state.graph.visibleEdgeIds);
}
export function useVisibleEdges(): Edge[] {
  const { visibleEdgeIds, edges } = useSelector((state) => state.graph);

  return useMemo(() => visibleEdgeIds.map((id) => edges[id]), [
    visibleEdgeIds,
    edges,
  ]);
}

export function useVisibleNodeIds(): string[] {
  return useSelector(
    (state) => fsf.deindex(state.graph.visibleNodes).map((x) => x.id),
    shallowEqual,
  );
}

export function useVisibleNodes(): VisibleNode[] {
  const { visibleNodes } = useSelector((state) => state.graph);
  return useMemo(() => fsf.deindex(visibleNodes), [visibleNodes]);
}

export function useFieldIds(nodeId: string): string[] {
  return useSelector(
    (state) => state.graph.nodes[nodeId]?.fieldIds || [],
    shallowEqual,
  );
}

export function useFields(nodeId: string): Field[] {
  const fieldIds = useFieldIds(nodeId);
  const allFields = useSelector((state) => state.graph.fields);

  return useMemo(
    () =>
      fieldIds
        .map((fieldId) => {
          const field = allFields[fieldId];

          if (!field) console.error('Cannot find field by ID:', fieldId);

          return field;
        })
        .filter((x) => x),
    [allFields, fieldIds],
  );
}
