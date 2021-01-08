import * as fsf from 'flux-standard-functions';

import {
  GraphState,
  defaultState,
  edgeDef,
  stateDef,
  VisibleNode,
  visibleNodeDef,
} from '.';
import { reducer as argsReducer } from './args/reducer';
import { reducer as fieldsReducer } from './fields/reducer';
import { reducer as nodesReducer } from './nodes/reducer';
import { GraphAction } from './graph-actions';
import { ArgAction } from './args/actions';
import { chainReducers } from '../state-utils';
import { FieldAction, fieldDef } from './fields';
import { NodeAction, nodeDef } from './nodes';
import { argDef } from './args/types';

export type Action = GraphAction | ArgAction | FieldAction | NodeAction;

export function reducer(
  state: GraphState = defaultState,
  action: Action,
): GraphState {
  return chainReducers(
    graphReducer,
    nodesReducer,
    argsReducer,
    fieldsReducer,
  )(state, action);
}

function graphReducer(state: GraphState, action: Action): GraphState {
  switch (action.type) {
    case 'graph/import_state': {
      const {
        payload: { args, nodes, edges, fields, visibleNodes },
      } = action;

      const fieldIdsByNodeId = new Map<string, Set<string>>();
      const fieldIdsByEdgeId = new Map<string, Set<string>>();
      const argIdsByFieldId = new Map<string, Set<string>>();
      for (const arg of args) {
        const byFieldId = argIdsByFieldId.get(arg.fieldId);
        if (byFieldId) {
          byFieldId.add(arg.id);
        } else {
          argIdsByFieldId.set(arg.fieldId, new Set([arg.id]));
        }
      }
      for (const field of fields) {
        const byNodeId = fieldIdsByNodeId.get(field.nodeId);
        if (byNodeId) {
          byNodeId.add(field.id);
        } else {
          fieldIdsByNodeId.set(field.nodeId, new Set([field.id]));
        }

        if (field.edgeId) {
          const byEdgeId = fieldIdsByEdgeId.get(field.edgeId);
          if (byEdgeId) {
            byEdgeId.add(field.id);
          } else {
            fieldIdsByEdgeId.set(field.edgeId, new Set([field.id]));
          }
        }
        field.argIds = Array.from(argIdsByFieldId.get(field.id) || []);
      }
      for (const node of nodes) {
        node.fieldIds = Array.from(fieldIdsByNodeId.get(node.id) || []);
      }
      for (const edge of edges) {
        edge.fieldIds = Array.from(fieldIdsByEdgeId.get(edge.id) || []);
      }

      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      const visibleEdgeIds = edges
        .filter(
          (edge) => visibleNodeIds.has(edge.id) && visibleNodeIds.has(edge.id),
        )
        .map((edge) => edge.id);

      return {
        args: fsf.index(args, argDef),
        argEdits: {},
        nodes: fsf.index(nodes, nodeDef),
        nodeEdits: {},
        edges: fsf.index(edges, edgeDef),
        edgeEdits: {},
        fields: fsf.index(fields, fieldDef),
        fieldEdits: {},
        visibleNodes: fsf.index(visibleNodes, visibleNodeDef),
        visibleEdgeIds,
      };
    }
    // TODO: deprecate in favor of passing visible nodes in graph/import_state
    case 'graph/import_save_state': {
      const { payload } = action;
      if (!payload?.graph?.visibleNodes) return state;

      const {
        nodeEdits,
        fieldEdits,
        edgeEdits, 
        argEdits,
        visibleNodes,
        selectedSourceNodeId: s,
        selectedFieldId: f,
        selectedTargetNodeId: t,
      } = payload.graph;

      let nextState = state;
      nextState = fsf.set(nextState, 'nodeEdits', nodeEdits, stateDef);
      nextState = fsf.set(nextState, 'fieldEdits', fieldEdits, stateDef);
      nextState = fsf.set(nextState, 'edgeEdits', edgeEdits, stateDef);
      nextState = fsf.set(nextState, 'argEdits', argEdits, stateDef);
      nextState = fsf.set(nextState, 'visibleNodes', {}, stateDef);
      nextState = fsf.set(nextState, 'visibleEdgeIds', [], stateDef);
      nextState = fsf.unset(nextState, 'selectedSourceNodeId', stateDef);
      nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
      nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);

      const nodeIds = new Set(Object.keys(visibleNodes));

      nextState = showNodes(nextState, nodeIds, visibleNodes);

      if (s && nextState.nodes[s]) {
        nextState = fsf.set(nextState, 'selectedSourceNodeId', s, stateDef);
      }
      if (
        f &&
        s &&
        t &&
        nextState.nodes[s] &&
        nextState.fields[f] &&
        nextState.nodes[t]
      ) {
        nextState = fsf.set(nextState, 'selectedFieldId', f, stateDef);
        nextState = fsf.set(nextState, 'selectedTargetNodeId', t, stateDef);
      }

      return nextState;
    }
    case 'graph/hide_all_nodes': {
      let nextState = state;
      nextState = fsf.set(nextState, 'visibleNodes', {}, stateDef);
      nextState = fsf.set(nextState, 'visibleEdgeIds', [], stateDef);
      nextState = fsf.unset(nextState, 'selectedSourceNodeId', stateDef);
      nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
      nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
      return nextState;
    }
    case 'graph/hide_unpinned_nodes': {
      const unpinnedNodeIds = new Set(
        fsf
          .deindex(state.visibleNodes)
          .filter((visibleNode) => !visibleNode.isPinned)
          .map((visibleNode) => visibleNode.id),
      );

      return hideNodes(state, unpinnedNodeIds);
    }
    case 'graph/expand_node': {
      const { payload: nodeId } = action;

      const visibleEdgeIds = new Set(state.visibleEdgeIds);

      const nodeIds = new Set(
        fsf
          .deindex(state.edges)
          .filter(
            (edge) =>
              !visibleEdgeIds.has(edge.id) &&
              (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId),
          )
          .map((edge) =>
            edge.sourceNodeId === nodeId
              ? edge.targetNodeId
              : edge.sourceNodeId,
          ),
      );

      return showNodes(state, nodeIds);
    }
    case 'graph/pin_node': {
      const {
        payload: { nodeId, x, y },
      } = action;

      if (!state.visibleNodes[nodeId]?.isPinned) {
        return fsf.patch(
          state,
          {
            visibleNodes: {
              [nodeId]: { id: nodeId, isPinned: true, x, y },
            },
          },
          stateDef,
        );
      } else {
        return state;
      }
    }
    case 'graph/unpin_node': {
      const { payload: nodeId } = action;

      if (state.visibleNodes[nodeId]?.isPinned) {
        return fsf.patch(
          state,
          {
            visibleNodes: {
              [nodeId]: { isPinned: false },
            },
          },
          stateDef,
        );
      } else {
        return state;
      }
    }
    case 'graph/update_node_location': {
      const {
        payload: { nodeId, x, y },
      } = action;

      if (state.visibleNodes[nodeId]?.isPinned) {
        return fsf.patch(
          state,
          {
            visibleNodes: {
              [nodeId]: { x, y },
            },
          },
          stateDef,
        );
      } else {
        return state;
      }
    }
    case 'graph/update_node_locations': {
      const { payload } = action;

      return fsf.patch(state, { visibleNodes: payload }, stateDef);
    }
    case 'graph/hide_node': {
      const { payload: nodeId } = action;
      return hideNodes(state, new Set([nodeId]));
    }
    case 'graph/show_node': {
      const { payload: nodeId } = action;
      return showNodes(state, new Set([nodeId]));
    }
    case 'graph/select_node': {
      const { payload: nodeId } = action;
      const node = state.nodes[nodeId];
      if (!node) return state;

      let nextState = state;
      nextState = fsf.set(nextState, 'selectedSourceNodeId', node.id, stateDef);
      nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
      nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);

      const nodesToShow = new Set<string>();
      if (!nextState.visibleNodes[node.id]) nodesToShow.add(node.id);

      if (nodesToShow.size) nextState = showNodes(nextState, nodesToShow);

      return nextState;
    }
    case 'graph/deselect_node': {
      const { payload: nodeId } = action;

      let nextState = state;

      if (nodeId === nextState.selectedSourceNodeId) {
        nextState = fsf.unset(nextState, 'selectedSourceNodeId', stateDef);
        nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
        nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
      } else if (nodeId === nextState.selectedTargetNodeId) {
        nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
        nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
      }

      return nextState;
    }
    case 'graph/select_field': {
      const { payload: fieldId } = action;
      const field = state.fields[fieldId];
      if (!field?.edgeId) return state;
      const edge = state.edges[field.edgeId];
      if (!edge) return state;

      let nextState = state;
      nextState = fsf.set(nextState, 'selectedFieldId', field.id, stateDef);

      const { sourceNodeId: s, targetNodeId: t } = edge;

      if (field.isReverse) {
        nextState = fsf.set(nextState, 'selectedSourceNodeId', t, stateDef);
        nextState = fsf.set(nextState, 'selectedTargetNodeId', s, stateDef);
      } else {
        nextState = fsf.set(nextState, 'selectedSourceNodeId', s, stateDef);
        nextState = fsf.set(nextState, 'selectedTargetNodeId', t, stateDef);
      }

      const nodesToShow = new Set<string>();
      if (!nextState.visibleNodes[s]) nodesToShow.add(s);
      if (!nextState.visibleNodes[t]) nodesToShow.add(t);

      if (nodesToShow.size) nextState = showNodes(nextState, nodesToShow);

      return nextState;
    }
    case 'graph/deselect_field': {
      const { payload: fieldId } = action;

      let nextState = state;

      if (fieldId === nextState.selectedFieldId) {
        nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
        nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
      }

      return nextState;
    }
    default:
      return state;
  }
}

function hideNodes(state: GraphState, nodeIds: Set<string>): GraphState {
  let nextState = state;
  const edgeIdsToHide = state.visibleEdgeIds
    .map((edgeId) => state.edges[edgeId])
    .filter(
      (edge) =>
        nodeIds.has(edge.sourceNodeId) || nodeIds.has(edge.targetNodeId),
    )
    .map((edge) => edge.id);

  // TODO: avoid unnecessary spread (issue: #45)
  nextState = {
    ...nextState,
    visibleEdgeIds: fsf.unsetEach(
      nextState.visibleEdgeIds,
      Array.from(edgeIdsToHide),
    ),
    visibleNodes: fsf.unsetEach(nextState.visibleNodes, Array.from(nodeIds)),
  };

  if (nodeIds.has(nextState.selectedSourceNodeId || '')) {
    nextState = fsf.unset(nextState, 'selectedSourceNodeId', stateDef);
    nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
    nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
  } else if (nodeIds.has(nextState.selectedTargetNodeId || '')) {
    nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
    nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
  }

  return nextState;
}

function showNodes(
  state: GraphState,
  nodeIds: Set<string>,
  data?: Record<string, VisibleNode>,
): GraphState {
  let nextState = state;

  const visibleEdgeIds = new Set(nextState.visibleEdgeIds);

  const nodesToShow = fsf.index(
    Array.from(nodeIds)
      .filter(
        (nodeId) => !nextState.visibleNodes[nodeId] && nextState.nodes[nodeId],
      )
      .map((nodeId) => data?.[nodeId] || { id: nodeId, isPinned: false }),
    visibleNodeDef,
  );

  const edgeIdsToShow = fsf
    .deindex(nextState.edges)
    .filter(
      (edge) =>
        !visibleEdgeIds.has(edge.id) &&
        (nodeIds.has(edge.sourceNodeId) ||
          nextState.visibleNodes[edge.sourceNodeId]) &&
        (nodeIds.has(edge.targetNodeId) ||
          nextState.visibleNodes[edge.targetNodeId]),
    )
    .map((edge) => edge.id);

  // TODO: avoid unnecessary spread (issue: #45)
  nextState = {
    ...state,
    visibleEdgeIds: fsf.setEach(nextState.visibleEdgeIds, edgeIdsToShow),
    visibleNodes: fsf.patchEach(
      nextState.visibleNodes,
      nodesToShow,
      visibleNodeDef,
    ),
  };

  return nextState;
}
