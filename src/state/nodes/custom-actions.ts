import { deindex } from 'flux-standard-functions';

import { nodes as nodesEntity } from '.';
import { FluxStandardAction, Thunk } from '..';

export function hideAllNodes(): Thunk {
  return async (dispatch, getState) => {
    const visible = deindex(getState().nodes.data).filter(
      (node) => node.isVisible,
    );

    const data = visible.reduce((acc, node) => {
      acc[node.id] = { isVisible: false };
      return acc;
    }, {});

    dispatch(nodesEntity.patchEach(data));
  };
}

export function hideUnpinnedNodes(): Thunk {
  return async (dispatch, getState) => {
    const visibleUnpinned = deindex(getState().nodes.data).filter(
      (node) => node.isVisible && !node.isPinned,
    );

    const data = visibleUnpinned.reduce((acc, node) => {
      acc[node.id] = { isVisible: false };
      return acc;
    }, {});

    dispatch(nodesEntity.patchEach(data));
  };
}

export function expandNode(nodeId: string): Thunk {
  return async (dispatch, getState) => {
    const state = getState();

    const node = state.nodes.data[nodeId];
    if (!node) return;

    // TODO: index edges by node ID
    const nodeIds = Array.from(
      deindex(getState().edges.data)
        .filter(
          (edge) =>
            edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId,
        )
        .reduce<Set<string>>((acc, edge) => {
          acc.add(edge.sourceNodeId);
          acc.add(edge.targetNodeId);
          return acc;
        }, new Set()),
    );

    const data = nodeIds.reduce((acc, id) => {
      acc[id] = { isVisible: true };
      return acc;
    }, {});

    dispatch(nodesEntity.patchEach(data));
  };
}

export const NODES_SELECT_NODE = 'NODES_SELECT_NODE';
export const selectNode = (nodeId: string) => ({
  type: NODES_SELECT_NODE,
  payload: nodeId,
});

export const NODES_DESELECT_NODE = 'NODES_DESELECT_NODE';
export const deselectNode = (nodeId: string) => ({
  type: NODES_DESELECT_NODE,
  payload: nodeId,
});
