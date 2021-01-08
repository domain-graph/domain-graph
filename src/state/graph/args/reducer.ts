import { chainReducers } from '../../state-utils';
import { GraphState } from '../types';
import {
  setArgAsDeleted,
  addDeletedArgIdsToFieldEdit,
  unsetEmptyFieldEditArgArrays,
  unsetUselessFieldEdit,
  unsetEachArgEdit,
  unsetArgIdsFromFieldEdit,
  patchArgEdit,
  unsetUselessArgEdit,
  addCreatedArgIdsToFieldEdit,
} from '../higher-order-reducers';
import { Action } from '../reducer';

export function reducer(state: GraphState, action: Action): GraphState {
  switch (action.type) {
    case 'edit/delete_arg': {
      const { payload: argId } = action;

      const argEdit = state.argEdits[argId];
      if (argEdit?.isDeleted) return state;

      const arg = state.args[argId];
      if (!arg && !argEdit) return state;

      const fieldId = arg?.fieldId || argEdit?.fieldId;

      return chainReducers(
        setArgAsDeleted(argId),
        addDeletedArgIdsToFieldEdit([argId], fieldId),
        unsetUselessFieldEdit(fieldId),
      )(state, action);
    }
    case 'edit/restore_arg': {
      const { payload: argId } = action;
      const arg = state.args[argId];
      if (!arg) return state;

      const argEdit = state.argEdits[argId];
      if (argEdit?.isNew) return state;

      const fieldId = arg?.fieldId || argEdit?.fieldId;

      return chainReducers(
        unsetEachArgEdit([argId]),
        unsetArgIdsFromFieldEdit([argId], fieldId),
        unsetEmptyFieldEditArgArrays(fieldId),
        unsetUselessFieldEdit(fieldId),
      )(state, action);
    }
    case 'edit/edit_arg': {
      const { payload } = action;
      const argEdit = state.argEdits[payload.id];
      if (argEdit?.isDeleted) return state;

      const arg = state.args[payload.id];
      if (!arg && !argEdit) return state;
      const fieldId = arg?.fieldId || argEdit?.fieldId;

      // TODO: prevent new state on useless ArgEdit
      return chainReducers(
        patchArgEdit({ ...payload, fieldId }),
        unsetUselessArgEdit(payload.id),
      )(state, action);
    }
    case 'edit/create_arg': {
      const { payload } = action;

      const argEdit = state.argEdits[payload.id];
      if (argEdit) return state;

      const arg = state.args[payload.id];
      if (arg) return state;

      return chainReducers(
        patchArgEdit({ ...payload, isNew: true }),
        addCreatedArgIdsToFieldEdit([payload.id], payload.fieldId),
      )(state, action);
    }
    default:
      return state;
  }
}
