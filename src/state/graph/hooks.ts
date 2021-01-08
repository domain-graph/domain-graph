import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import * as fsf from 'flux-standard-functions';

import { Node, Edge, Field, VisibleNode, edgeDef, EdgeEdit } from '../types';
import { useSelector } from '..';

export interface Edited<T> {
  current: T;
  original: T | undefined;
}

function getEditedEdge(
  original: Edge | undefined,
  edit: EdgeEdit | undefined,
): Edited<Edge> {
  if (!edit && original) {
    return {
      original,
      current: original,
    };
  }

  const fieldIds = fsf.setEach(
    fsf.unsetEach(original?.fieldIds || [], edit?.deletedFieldIds || []),
    edit?.createdFieldIds || [],
  );

  const current: Edge | undefined = original
    ? fsf.patch(original, { ...edit, fieldIds }, edgeDef)
    : edgeDef.getPayload({ ...edit, fieldIds });

  return {
    original,
    current,
  };
}

export function useEdge(edgeId: string): Edited<Edge> {
  const original = useSelector((state) => state.graph.edges[edgeId]);
  const edit = useSelector((state) => state.graph.edgeEdits[edgeId]);

  return useMemo(() => getEditedEdge(original, edit), [original, edit]);
}

export function useVisibleEdgeIds(): string[] {
  return useSelector((state) => state.graph.visibleEdgeIds);
}
export function useVisibleEdges(): Edited<Edge>[] {
  const { visibleEdgeIds, edges, edgeEdits } = useSelector(
    (state) => state.graph,
  );

  return useMemo(
    () => visibleEdgeIds.map((id) => getEditedEdge(edges[id], edgeEdits[id])),
    [visibleEdgeIds, edges, edgeEdits],
  );
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
