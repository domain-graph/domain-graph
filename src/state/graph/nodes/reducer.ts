import * as fsf from 'flux-standard-functions';
import { GraphState, stateDef } from '../types';
import { hideNodes } from '../higher-order-reducers';
import { Node, nodeDef, nodeEditDef } from './types';
import { Action } from '../reducer';

export function reducer(state: GraphState, action: Action): GraphState {
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

      return hideNodes(new Set([nodeId]))(nextState, action);
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
    default:
      return state;
  }
}
