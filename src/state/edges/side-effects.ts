import { patch, Patch, set, unset } from 'flux-standard-functions';

import { Edge, EdgesState, stateDef } from '.';
import { SideEffect } from '../entity';
import * as customActions from './custom-actions';
import * as customNodeActions from '../nodes/custom-actions';

export const handleSelectEdges: SideEffect<Edge, EdgesState> = (
  _,
  currentState,
  action,
) => {
  // TODO: handle node events that hide nodes
  switch (action.type) {
    case customActions.EDGES_SET_SELECTED_EDGE: {
      const { payload } = action as ReturnType<
        typeof customActions['setSelectedEdge']
      >;
      const edge = currentState.data[payload.edgeId];
      if (!edge) return currentState;

      return set(currentState, 'selectedEdgeId', payload.edgeId, stateDef);
    }
    case customActions.EDGES_UNSET_SELECTED_EDGE: {
      return unset(currentState, 'selectedEdgeId', stateDef);
    }
    case customNodeActions.NODES_SELECT_NODE:
    case customNodeActions.NODES_DESELECT_NODE: {
      return unset(currentState, 'selectedEdgeId', stateDef);
    }
    default:
      return currentState;
  }
};
