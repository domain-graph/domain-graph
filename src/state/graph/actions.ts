import { VisibleNode, Node, Edge, Field, Arg } from '.';
import { SaveState } from '../../persistence';

export const importState = (
  nodes: Node[],
  edges: Edge[],
  fields: Field[],
  args: Arg[],
  visibleNodes: VisibleNode[],
) => ({
  type: 'graph/import_state' as const,
  payload: { args, nodes, edges, fields, visibleNodes },
});

export const importSaveState = (state: SaveState) => ({
  type: 'graph/import_save_state' as const,
  payload: state,
});

export const hideAllNodes = () => ({
  type: 'graph/hide_all_nodes' as const,
});

export const hideUnpinnedNodes = () => ({
  type: 'graph/hide_unpinned_nodes' as const,
});

export const expandNode = (nodeId: string) => ({
  type: 'graph/expand_node' as const,
  payload: nodeId,
});

export const pinNode = (nodeId: string, x: number, y: number) => ({
  type: 'graph/pin_node' as const,
  payload: { nodeId, x, y },
});

export const unpinNode = (nodeId: string) => ({
  type: 'graph/unpin_node' as const,
  payload: nodeId,
});

export const updateNodeLocation = (nodeId: string, x: number, y: number) => ({
  type: 'graph/update_node_location' as const,
  payload: { nodeId, x, y },
});

export const updateNodeLocations = (
  nodes: Record<string, { x: number; y: number }>,
) => ({
  type: 'graph/update_node_locations' as const,
  payload: nodes,
});

export const hideNode = (nodeId: string) => ({
  type: 'graph/hide_node' as const,
  payload: nodeId,
});

export const showNode = (nodeId: string) => ({
  type: 'graph/show_node' as const,
  payload: nodeId,
});

export const selectNode = (nodeId: string) => ({
  type: 'graph/select_node' as const,
  payload: nodeId,
});

export const deselectNode = (nodeId: string) => ({
  type: 'graph/deselect_node' as const,
  payload: nodeId,
});

export const selectField = (fieldId: string) => ({
  type: 'graph/select_field' as const,
  payload: fieldId,
});

export const deselectField = (fieldId: string) => ({
  type: 'graph/deselect_field' as const,
  payload: fieldId,
});

export type Action =
  | ReturnType<typeof importState>
  | ReturnType<typeof importSaveState>
  | ReturnType<typeof hideAllNodes>
  | ReturnType<typeof hideUnpinnedNodes>
  | ReturnType<typeof expandNode>
  | ReturnType<typeof pinNode>
  | ReturnType<typeof unpinNode>
  | ReturnType<typeof updateNodeLocation>
  | ReturnType<typeof updateNodeLocations>
  | ReturnType<typeof hideNode>
  | ReturnType<typeof showNode>
  | ReturnType<typeof selectNode>
  | ReturnType<typeof deselectNode>
  | ReturnType<typeof selectField>
  | ReturnType<typeof deselectField>;
