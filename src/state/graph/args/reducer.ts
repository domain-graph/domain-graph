import { chainReducers } from '../../state-utils';
import { EditAction } from '../edit-actions';
import { GraphAction } from '../graph-actions';
import { GraphState } from '../types';
import {
  setArgAsDeleted,
  addDeletedArgIdsToFieldEdit,
  unsetEmptyFieldEditArgArrays,
  unsetUselessFieldEdit,
} from './higher-order-reducers';

export type Action = EditAction | GraphAction;

export function argReducer(state: GraphState, action: Action): GraphState {
  switch (action.type) {
    case 'edit/delete_arg': {
      const { payload: argId } = action;
      const arg = state.args[argId];
      const argEdit = state.argEdits[argId];
      const fieldId = arg?.fieldId || argEdit?.fieldId;

      return chainReducers(
        setArgAsDeleted(argId),
        addDeletedArgIdsToFieldEdit([argId], fieldId),
        unsetEmptyFieldEditArgArrays(fieldId),
        unsetUselessFieldEdit(fieldId),
      )(state, action);
    }
    case 'edit/restore_arg': {
      return state;
    }
    case 'edit/edit_arg': {
      return state;
    }
    case 'edit/create_arg': {
      return state;
    }
    default:
      return state;
  }
}
