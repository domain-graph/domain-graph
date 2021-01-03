import * as fsf from 'flux-standard-functions';

import {
  GraphState,
  stateDef,
  visibleNodeDef,
  nodeDef,
  edgeDef,
  fieldDef,
  defaultState,
  argDef,
  VisibleNode,
  nodeEditDef,
} from '.';
import { EditAction } from './edit-actions';
import { GraphAction } from './graph-actions';
import { fieldEditDef, NodeEdit } from './types';

export type Action = EditAction | GraphAction;

export function reducer(
  state: GraphState = defaultState,
  action: Action,
): GraphState {
  let nextState = state;

  nextState = graphReducer(nextState, action);
  nextState = editReducer(nextState, action);

  return nextState;
}

function editReducer(state: GraphState, action: Action): GraphState {
  switch (action.type) {
    case 'edit/delete_node': {
      const { payload: nodeId } = action;
      const node = state.nodes[nodeId];
      if (!node) return state;
      const nodeEdit = state.nodeEdits[nodeId];

      let nextState = state;

      if (nodeEdit?.isNew) {
        nextState = fsf.set(
          nextState,
          'nodes',
          fsf.unset(nextState.nodes, nodeId),
          stateDef,
        );
        nextState = fsf.set(
          nextState,
          'nodeEdits',
          fsf.unset(nextState.nodeEdits, nodeId),
          stateDef,
        );
        // TODO: if node is net-new, also unset all associated new edges, fields, and args
      } else {
        nextState = fsf.set(
          nextState,
          'nodeEdits',
          fsf.set(
            nextState.nodeEdits,
            { id: nodeId, isDeleted: true },
            nodeEditDef,
          ),
          stateDef,
        );
      }

      nextState = hideNodes(nextState, new Set([nodeId]));

      return nextState;
    }
    case 'edit/restore_node': {
      const { payload: nodeId } = action;
      const nodeEdit = state.nodeEdits[nodeId];
      if (nodeEdit?.isNew) return state;

      return fsf.set(
        state,
        'nodeEdits',
        fsf.unset(state.nodeEdits, nodeId),
        stateDef,
      );
    }
    case 'edit/edit_node': {
      const { payload } = action;

      const node = state.nodes[payload.id];
      if (!node) return state;
      if (node === fsf.patch(node, payload, nodeDef)) return state;

      return fsf.patch(
        state,
        {
          nodeEdits: {
            [payload.id]: { ...payload, isDeleted: false },
          },
        },
        stateDef,
      );
    }
    case 'edit/create_node': {
      const { payload } = action;
      if (state.nodes[payload.id]) return state;
      if (state.nodeEdits[payload.id]) return state;

      return fsf.patch(
        state,
        {
          nodeEdits: {
            [payload.id]: { ...payload, isNew: true },
          },
        },
        stateDef,
      );
    }
    case 'edit/edit_field': {
      const { payload } = action;

      const field = state.fields[payload.id];
      if (!field) return state;
      if (field === fsf.patch(field, payload, fieldDef)) return state;

      return fsf.patch(
        state,
        {
          fieldEdits: {
            [payload.id]: {
              ...payload,
              nodeId: field.nodeId,
              isDeleted: false,
            },
          },
        },
        stateDef,
      );
    }
    case 'edit/delete_field': {
      const { payload: fieldId } = action;
      const field = state.fields[fieldId];
      if (!field) return state;
      const nodeEdit = state.nodeEdits[field.nodeId];
      const fieldEdit = state.fieldEdits[fieldId];

      let nextState = state;

      // If the field is net-new
      if (fieldEdit?.isNew) {
        // unset field edit
        nextState = fsf.set(
          nextState,
          'fieldEdits',
          fsf.unset(nextState.fieldEdits, fieldId),
          stateDef,
        );

        nextState = removeFieldIdsFromNodeEdit(
          nextState,
          [fieldId],
          fieldEdit.nodeId,
        );
      } else {
        // set fieldEdit as deleted
        nextState = fsf.set(
          nextState,
          'fieldEdits',
          fsf.set(
            nextState.fieldEdits,
            { id: fieldId, nodeId: field.nodeId, isDeleted: true },
            fieldEditDef,
          ),
          stateDef,
        );

        // add fieldId to nodeEdit.deletedFieldIds
        nextState = fsf.patch(
          nextState,
          {
            nodeEdits: {
              [field.nodeId]: {
                id: field.nodeId,
                deletedFieldIds: fsf.set(
                  nodeEdit?.deletedFieldIds || [],
                  fieldId,
                ),
              },
            },
          },
          stateDef,
        );
      }

      return nextState;
    }
    case 'edit/restore_field': {
      const { payload: fieldId } = action;
      const fieldEdit = state.fieldEdits[fieldId];
      if (!fieldEdit) return state;
      if (fieldEdit.isNew) return state;

      let nextState = state;

      if (fieldEdit.isDeleted) {
        nextState = removeFieldIdsFromNodeEdit(
          nextState,
          [fieldId],
          fieldEdit.nodeId,
        );
      }
      nextState = fsf.set(
        nextState,
        'fieldEdits',
        fsf.unset(nextState.fieldEdits, fieldId),
        stateDef,
      );

      return nextState;
    }
    case 'edit/create_field': {
      const { payload } = action;
      if (!payload.id) return state;
      if (state.fields[payload.id]) return state;
      if (state.fieldEdits[payload.id]) return state;

      const nodeEdit = state.nodeEdits[payload.nodeId];

      const updatedNodeEdit: NodeEdit = nodeEdit
        ? fsf.patch(
            nodeEdit,
            {
              createdFieldIds: fsf.set(
                nodeEdit.createdFieldIds || [],
                payload.id,
              ),
            },
            nodeEditDef,
          )
        : {
            id: payload.nodeId,
            createdFieldIds: [payload.id],
          };

      return fsf.patch(
        state,
        {
          nodeEdits: {
            [updatedNodeEdit.id]: updatedNodeEdit,
          },
          fieldEdits: {
            [payload.id]: { ...payload, isNew: true },
          },
        },
        stateDef,
      );
    }
    default:
      return state;
  }
}

function removeFieldIdsFromNodeEdit(
  state: GraphState,
  fieldIds: string[],
  nodeId: string,
): GraphState {
  let nodeEdit = state.nodeEdits[nodeId];
  if (!nodeEdit) return state;

  // remove from nodeEdit field arrays
  nodeEdit = fsf.patch(
    nodeEdit || {},
    {
      deletedFieldIds: nodeEdit?.deletedFieldIds
        ? fsf.unsetEach(nodeEdit.deletedFieldIds, fieldIds)
        : undefined,
      createdFieldIds: nodeEdit?.createdFieldIds
        ? fsf.unsetEach(nodeEdit.createdFieldIds, fieldIds)
        : undefined,
    },
    nodeEditDef,
  );

  // unset nodeEdit field arrays if empty
  if (!nodeEdit.deletedFieldIds?.length) {
    nodeEdit = fsf.unset(nodeEdit, 'deletedFieldIds', nodeEditDef);
  }
  if (!nodeEdit.createdFieldIds?.length) {
    nodeEdit = fsf.unset(nodeEdit, 'createdFieldIds', nodeEditDef);
  }

  // if nodeEdit doesn't change the node an non-net-new node
  const node = state.nodes[nodeId];
  if (!nodeEdit?.isNew && node === fsf.patch(node, nodeEdit, nodeDef)) {
    // unset nodeEdit
    return fsf.set(
      state,
      'nodeEdits',
      fsf.unset(state.nodeEdits, nodeEdit.id),
      stateDef,
    );
  } else {
    // otherwise, update state
    return fsf.set(
      state,
      'nodeEdits',
      fsf.set(state.nodeEdits, nodeEdit, nodeEditDef),
      stateDef,
    );
  }
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
        visibleNodes,
        selectedSourceNodeId: s,
        selectedFieldId: f,
        selectedTargetNodeId: t,
      } = payload.graph;

      let nextState = state;
      nextState = fsf.set(nextState, 'nodeEdits', nodeEdits, stateDef);
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
