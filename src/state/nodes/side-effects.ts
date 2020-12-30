import {
  patch,
  Patch,
  set,
  setEach,
  unset,
  unsetEach,
} from 'flux-standard-functions';

import { Node, NodesState, nodes, stateDef } from '.';
import { SideEffect } from '../entity';
import * as customActions from './custom-actions';
import * as customFieldActions from '../fields/custom-actions';

export const handleNodeVisibility: SideEffect<Node, NodesState> = (
  originalState,
  currentState,
  action,
) => {
  if (currentState === originalState) return originalState;
  const nodesIdThatBecameHidden = new Set<string>();
  const nodesIdThatBecameVisible = new Set<string>();

  if (nodes.isPatch(action)) {
    if (
      action.payload.data.isVisible === false &&
      originalState.data[action.payload.key]?.isVisible
    ) {
      nodesIdThatBecameHidden.add(action.payload.key);
    } else if (
      action.payload.data.isVisible === true &&
      originalState.data[action.payload.key]?.isVisible !== true
    ) {
      nodesIdThatBecameVisible.add(action.payload.key);
    }
  } else if (nodes.isSet(action)) {
    if (
      action.payload.isVisible === false &&
      originalState.data[action.payload.id]?.isVisible
    ) {
      nodesIdThatBecameHidden.add(action.payload.id);
    } else if (
      action.payload.isVisible === true &&
      originalState.data[action.payload.id]?.isVisible !== true
    ) {
      nodesIdThatBecameVisible.add(action.payload.id);
    }
  } else if (nodes.isPatchEach(action) || nodes.isSetEach(action)) {
    for (const nodeId of Object.keys(action.payload)) {
      if (
        action.payload[nodeId].isVisible === false &&
        originalState.data[nodeId]?.isVisible
      ) {
        nodesIdThatBecameHidden.add(nodeId);
      } else if (
        action.payload[nodeId].isVisible === true &&
        originalState.data[nodeId]?.isVisible !== true
      ) {
        nodesIdThatBecameVisible.add(nodeId);
      }
    }
  }

  let nextState = currentState;

  if (nodesIdThatBecameHidden.size) {
    const arr = Array.from(nodesIdThatBecameHidden);
    const data: Record<string, Patch<Node>> = arr.reduce((acc, nodeId) => {
      acc[nodeId] = { isPinned: false };
      return acc;
    }, {});

    nextState = patch(nextState, { data }, stateDef);

    nextState.visibleNodeIds = unsetEach(nextState.visibleNodeIds, arr);

    if (
      nextState.selectedSourceNodeId &&
      nodesIdThatBecameHidden.has(nextState.selectedSourceNodeId)
    ) {
      nextState = unset(nextState, 'selectedSourceNodeId', stateDef);
      nextState = unset(nextState, 'selectedTargetNodeId', stateDef);
    } else if (
      nextState.selectedTargetNodeId &&
      nodesIdThatBecameHidden.has(nextState.selectedTargetNodeId)
    ) {
      nextState = unset(nextState, 'selectedTargetNodeId', stateDef);
    }
  }

  if (nodesIdThatBecameVisible.size) {
    const arr = Array.from(nodesIdThatBecameVisible);
    nextState.visibleNodeIds = setEach(nextState.visibleNodeIds, arr);
  }

  return nextState;
};

export const handleSelectNodes: SideEffect<Node, NodesState> = (
  originalState,
  currentState,
  action,
) => {
  switch (action.type) {
    case customActions.NODES_SELECT_NODE: {
      const { payload: nodeId } = action as ReturnType<
        typeof customActions['selectNode']
      >;
      const sourceNode = currentState.data[nodeId];
      if (!sourceNode) return currentState;

      let nextState = set(
        currentState,
        'selectedSourceNodeId',
        nodeId,
        stateDef,
      );
      nextState = patch(
        nextState,
        { data: { [nodeId]: { isVisible: true } } },
        stateDef,
      );
      nextState = unset(nextState, 'selectedTargetNodeId', stateDef);
      return nextState;
    }
    case customActions.NODES_DESELECT_NODE: {
      const { payload: nodeId } = action as ReturnType<
        typeof customActions['deselectNode']
      >;

      if (nodeId === currentState.selectedSourceNodeId) {
        let nextState = unset(currentState, 'selectedSourceNodeId', stateDef);
        nextState = unset(nextState, 'selectedTargetNodeId', stateDef);
        return nextState;
      } else if (nodeId === currentState.selectedTargetNodeId) {
        return unset(currentState, 'selectedTargetNodeId', stateDef);
      }

      return currentState;
    }
    case customFieldActions.FIELDS_UNSET_SELECTED_FIELD: {
      return unset(currentState, 'selectedTargetNodeId', stateDef);
    }
    case customFieldActions.FIELDS_SET_SELECTED_FIELD: {
      const {
        payload: { sourceNodeId, targetNodeId },
      } = action as ReturnType<typeof customFieldActions['setSelectedField']>;
      const sourceNode = currentState.data[sourceNodeId];
      if (!sourceNode) return currentState;

      const targetNode = currentState.data[targetNodeId];
      if (!targetNode) return currentState;

      let nextState = set(
        currentState,
        'selectedSourceNodeId',
        sourceNodeId,
        stateDef,
      );
      nextState = set(
        nextState,
        'selectedTargetNodeId',
        targetNodeId,
        stateDef,
      );
      nextState = patch(
        nextState,
        {
          data: {
            [sourceNodeId]: { isVisible: true },
            [targetNodeId]: { isVisible: true },
          },
        },
        stateDef,
      );

      if (!originalState.data[sourceNodeId]?.isVisible) {
        nextState.visibleNodeIds = set(nextState.visibleNodeIds, sourceNodeId);
      }
      if (!originalState.data[targetNodeId]?.isVisible) {
        nextState.visibleNodeIds = set(nextState.visibleNodeIds, targetNodeId);
      }

      return nextState;
    }
    default:
      return currentState;
  }
};
