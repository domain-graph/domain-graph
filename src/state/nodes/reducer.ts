import {
  define,
  Index,
  indexOf,
  patch,
  required,
  set,
  setEach,
  unset,
  unsetEach,
} from 'flux-standard-functions';

import { FluxStandardAction } from '..';
import { Type, Action } from './action-types';
import { Node, nodeDef } from './types';

export type NodeReducerState = {
  data: Index<Node>;
};

const stateDef = define<NodeReducerState>({
  data: required(indexOf(nodeDef)),
});

const initialState: NodeReducerState = {
  data: {},
};

export function nodeReducer(
  state: NodeReducerState = initialState,
  action: FluxStandardAction<Type, any, any>,
): NodeReducerState {
  switch (action?.type) {
    case Type.patchNode: {
      const { payload } = action as Action.PatchNode;
      if (!payload) return state;

      return patch(
        state,
        { data: { [payload.nodeId]: payload.updateData } },
        stateDef,
      );
    }
    case Type.patchEachNode: {
      const { payload } = action as Action.PatchEachNode;

      return patch(state, { data: payload }, stateDef);
    }
    case Type.setNode: {
      const { payload } = action as Action.SetNode;
      if (!payload) return state;

      const data = set(state.data, payload, nodeDef);

      return data === state.data ? state : { ...state, data };
    }
    case Type.setEachNode: {
      const { payload } = action as Action.SetEachNode;
      if (!payload) return state;

      const data = setEach(state.data, payload, nodeDef);

      return data === state.data ? state : { ...state, data };
    }
    case Type.unsetNode: {
      const { payload } = action as Action.UnsetNode;
      if (!payload) return state;

      const data = unset(state.data, payload);

      return data === state.data ? state : { ...state, data };
    }
    case Type.unsetEachNode: {
      const { payload } = action as Action.UnsetEachNode;
      if (!payload) return state;

      const data = unsetEach(state.data, payload);

      return data === state.data ? state : { ...state, data };
    }
    default:
      return state;
  }
}
