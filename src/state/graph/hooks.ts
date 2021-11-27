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

function respectPlugins<T extends { hideWith?: string[]; showWith?: string[] }>(
  entity: T | undefined,
  activePlugins: Set<string>,
): T | undefined {
  if (!entity) {
    return undefined;
  } else if (!entity.hideWith?.length && !entity.showWith?.length) {
    return entity;
  } else if (
    entity.hideWith &&
    entity.hideWith.some((plugin) => activePlugins.has(plugin))
  ) {
    return undefined;
  } else if (
    entity.showWith &&
    !entity.showWith.some((plugin) => activePlugins.has(plugin))
  ) {
    return undefined;
  } else {
    return entity;
  }
}

function useActivePlugins(): Set<string> {
  const activePlugins = useSelector((state) => state.graph.activePlugins);
  return useMemo(() => new Set(activePlugins), [activePlugins]);
}

const isTruthy = <T>(x: T | undefined): x is T => typeof x !== 'undefined';

export function useArg(argId: string | undefined): Arg | undefined {
  const arg = useSelector((state) => state.graph.args[argId || '']);
  const activePlugins = useActivePlugins();
  return respectPlugins(arg, activePlugins);
}

export function useEdge(edgeId: string | undefined): Edge | undefined {
  const edge = useSelector((state) => state.graph.edges[edgeId || '']);
  const activePlugins = useActivePlugins();
  return respectPlugins(edge, activePlugins);
}

export function useField(fieldId: string): Field | undefined {
  const field = useSelector((state) => state.graph.fields[fieldId]);
  const activePlugins = useActivePlugins();
  return respectPlugins(field, activePlugins);
}

export function useFieldIds(nodeId: string): string[] {
  // TODO: respect plugins
  return useSelector(
    (state) => state.graph.nodes[nodeId]?.fieldIds || [],
    shallowEqual,
  );
}

export function useFieldIdsByEdge(edgeId: string): string[] {
  // TODO: respect plugins
  return useSelector(
    (state) => state.graph.edges[edgeId]?.fieldIds || [],
    shallowEqual,
  );
}

export function useFields(nodeId: string): Field[] {
  const fieldIds = useFieldIds(nodeId);
  const allFields = useSelector((state) => state.graph.fields);
  const activePlugins = useActivePlugins();

  return useMemo(
    () =>
      fieldIds
        .map((fieldId) => {
          const field = allFields[fieldId];

          if (!field) console.error('Cannot find field by ID:', fieldId);

          return respectPlugins(field, activePlugins);
        })
        .filter(isTruthy),
    [allFields, fieldIds, activePlugins],
  );
}

export function useFieldsByEdge(edgeId: string): Field[] {
  const fieldIds = useFieldIdsByEdge(edgeId);
  const allFields = useSelector((state) => state.graph.fields);
  const activePlugins = useActivePlugins();

  return useMemo(
    () =>
      fieldIds
        .map((fieldId) => {
          const field = allFields[fieldId];

          if (!field) console.error('Cannot find field by ID:', fieldId);

          return respectPlugins(field, activePlugins);
        })
        .filter(isTruthy),
    [allFields, fieldIds, activePlugins],
  );
}

export function useNode(nodeId: string | undefined): Node | undefined {
  const node = useSelector((state) => state.graph.nodes[nodeId || '']);
  const activePlugins = useActivePlugins();
  return respectPlugins(node, activePlugins);
}

export function useAllNodes(): Node[] {
  const allNodes = useSelector((state) => fsf.deindex(state.graph.nodes));
  const activePlugins = useActivePlugins();

  return useMemo(
    () =>
      allNodes
        .map((node) => respectPlugins(node, activePlugins))
        .filter(isTruthy),
    [allNodes, activePlugins],
  );
}

export function useEnum(enumId: string | undefined): Enum | undefined {
  const e = useSelector((state) => state.graph.enums[enumId || '']);
  const activePlugins = useActivePlugins();
  return respectPlugins(e, activePlugins);
}

export function useEnumValue(enumValueId: string): EnumValue | undefined {
  const enumValue = useSelector((state) => state.graph.enumValues[enumValueId]);
  const activePlugins = useActivePlugins();
  return respectPlugins(enumValue, activePlugins);
}

export function useEnumValues(enumId: string): EnumValue[] {
  const enumValueIds = useEnum(enumId)?.valueIds;
  const enumValues = useSelector((state) => state.graph.enumValues);
  const activePlugins = useActivePlugins();

  return useMemo(() => {
    return (enumValueIds || [])
      .map((id) => respectPlugins(enumValues[id], activePlugins))
      .filter(isTruthy);
  }, [enumValueIds, enumValues, activePlugins]);
}

export function useInput(inputId: string | undefined): Input | undefined {
  const input = useSelector((state) => state.graph.inputs[inputId || '']);
  const activePlugins = useActivePlugins();
  return respectPlugins(input, activePlugins);
}

export function useInputField(inputFieldId: string): InputField | undefined {
  const inputField = useSelector(
    (state) => state.graph.inputFields[inputFieldId],
  );
  const activePlugins = useActivePlugins();
  return respectPlugins(inputField, activePlugins);
}

export function useInputFields(inputId: string): InputField[] {
  const inputFieldIds = useInput(inputId)?.inputFieldIds;
  const inputFields = useSelector((state) => state.graph.inputFields);
  const activePlugins = useActivePlugins();

  return useMemo(() => {
    return (inputFieldIds || [])
      .map((id) => respectPlugins(inputFields[id], activePlugins))
      .filter(isTruthy);
  }, [inputFieldIds, inputFields, activePlugins]);
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

export function useAllVisibleNodes(): VisibleNode[] {
  const { visibleNodes } = useSelector((state) => state.graph);
  // TODO: respect plugins
  return useMemo(() => fsf.deindex(visibleNodes), [visibleNodes]);
}

export function useVisibleNodes(): Record<string, VisibleNode> {
  // TODO: respect plugins
  return useSelector((state) => state.graph.visibleNodes);
}

export function useIsPinned(nodeId: string): boolean {
  // TODO: respect plugins
  return useSelector(
    (state) => state.graph.visibleNodes[nodeId]?.isPinned === true,
  );
}

export function useIsVisible(nodeId: string): boolean {
  // TODO: respect plugins
  return useSelector((state) => !!state.graph.visibleNodes[nodeId]);
}

export function useSelectedFieldId(): string | undefined {
  return useSelector((state) => state.graph.selectedFieldId);
}

export function useSelectedSourceNodeId(): string | undefined {
  return useSelector((state) => state.graph.selectedSourceNodeId);
}

export function useSelectedTargetNodeId(): string | undefined {
  return useSelector((state) => state.graph.selectedTargetNodeId);
}

export function useVisibleNodeBounds() {
  const visibleNodes = useAllVisibleNodes();

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
