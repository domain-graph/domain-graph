import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import { useSelector } from '..';
import { Field } from '../fields';
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
  return useSelector(
    (state) => state.fields.ix_nodeId[nodeId]?.fieldIds || [],
    shallowEqual,
  );
}

export function useFields(nodeId: string): Field[] {
  const fieldIds = useFieldIds(nodeId);
  const allFields = useSelector((state) => state.fields.data);

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
