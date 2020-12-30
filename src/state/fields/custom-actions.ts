import { Thunk } from '..';

export const selectField = (fieldId: string): Thunk => async (
  dispatch,
  getState,
) => {
  const state = getState();
  const { fields, edges } = state;
  const field = fields.data[fieldId];
  if (!field?.edgeId) return;

  const edge = edges.data[field.edgeId];
  if (!edge) return;

  const { sourceNodeId, targetNodeId } = edge;

  dispatch(setSelectedField({ sourceNodeId, fieldId, targetNodeId }));
};

export const FIELDS_SET_SELECTED_FIELD = 'FIELDS_SET_SELECTED_FIELD';
export const setSelectedField = (payload: {
  sourceNodeId: string;
  fieldId: string;
  targetNodeId: string;
}) => ({ type: FIELDS_SET_SELECTED_FIELD, payload });

export const FIELDS_UNSET_SELECTED_FIELD = 'FIELDS_UNSET_SELECTED_FIELD';
export const unsetSelectedField = () => ({
  type: FIELDS_UNSET_SELECTED_FIELD,
});
