import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import * as fsf from 'flux-standard-functions';

import {
  Node,
  Edge,
  Field,
  VisibleNode,
  Arg,
  Enum,
  EnumValue,
  Input,
  InputField,
} from './types';
import { useSelector } from '..';

export function useArg(argId: string): Arg | undefined {
  // TODO: respect plugins
  return useSelector((state) => state.graph.args[argId]);
}

export function useField(fieldId: string): Field | undefined {
  // TODO: respect plugins
  return useSelector((state) => state.graph.fields[fieldId]);
}

export function useEdge(edgeId: string): Edge | undefined {
  // TODO: respect plugins
  return useSelector((state) => state.graph.edges[edgeId]);
}

export function useNode(nodeId: string): Node | undefined {
  // TODO: respect plugins
  return useSelector((state) => state.graph.nodes[nodeId]);
}

export function useVisibleEdgeIds(): string[] {
  // TODO: respect plugins
  return useSelector((state) => state.graph.visibleEdgeIds);
}
export function useVisibleEdges(): Edge[] {
  const { visibleEdgeIds, edges } = useSelector((state) => state.graph);

  // TODO: respect plugins
  return useMemo(() => visibleEdgeIds.map((id) => edges[id]), [
    visibleEdgeIds,
    edges,
  ]);
}

export function useVisibleNodeIds(): string[] {
  // TODO: respect plugins
  return useSelector(
    (state) => fsf.deindex(state.graph.visibleNodes).map((x) => x.id),
    shallowEqual,
  );
}

export function useVisibleNodes(): VisibleNode[] {
  const { visibleNodes } = useSelector((state) => state.graph);
  // TODO: respect plugins
  return useMemo(() => fsf.deindex(visibleNodes), [visibleNodes]);
}

export function useFieldIds(nodeId: string): string[] {
  // TODO: respect plugins
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

export function useEnum(enumId: string): Enum | undefined {
  return useSelector((state) => state.graph.enums[enumId]);
}

export function useEnumValues(enumId: string): EnumValue[] {
  const enumValueIds = useEnum(enumId)?.valueIds;
  const enumValues = useSelector((state) => state.graph.enumValues);

  return useMemo(() => {
    return (enumValueIds || []).map((id) => enumValues[id]).filter((x) => x);
  }, [enumValueIds, enumValues]);
}

export function useInput(inputId: string): Input | undefined {
  return useSelector((state) => state.graph.inputs[inputId]);
}

export function useInputFields(inputId: string): InputField[] {
  const inputFieldIds = useInput(inputId)?.inputFieldIds;
  const inputFields = useSelector((state) => state.graph.inputFields);

  return useMemo(() => {
    return (inputFieldIds || []).map((id) => inputFields[id]).filter((x) => x);
  }, [inputFieldIds, inputFields]);
}

export function useVisibleNodeBounds() {
  const visibleNodes = useVisibleNodes();

  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  for (const node of visibleNodes) {
    if (typeof node.x === 'number' && node.x < minX) minX = node.x;
    if (typeof node.x === 'number' && node.x > maxX) maxX = node.x;
    if (typeof node.y === 'number' && node.y < minY) minY = node.y;
    if (typeof node.y === 'number' && node.y > maxY) maxY = node.y;
  }

  return useMemo(() => ({ minX, maxX, minY, maxY }), [minX, maxX, minY, maxY]);
}
