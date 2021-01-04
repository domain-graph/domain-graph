import * as fsf from 'flux-standard-functions';
import { Reducer } from '../../state-utils';
import {
  argEditDef,
  fieldDef,
  fieldEditDef,
  GraphState,
  stateDef,
} from '../types';

export const setArgAsDeleted = (argId: string) => (
  state: GraphState,
): GraphState => {
  const arg = state.args[argId];
  const argEdit = state.argEdits[argId];

  if (!arg && !argEdit) return state;

  if (argEdit?.isNew) {
    return fsf.set(
      state,
      'argEdits',
      fsf.unset(state.argEdits, argId),
      stateDef,
    );
  } else if (arg && !argEdit?.isDeleted) {
    return fsf.set(
      state,
      'argEdits',
      fsf.set(
        state.argEdits,
        { id: argId, fieldId: arg.fieldId, isDeleted: true },
        argEditDef,
      ),
      stateDef,
    );
  }
  return state;
};

export const addDeletedArgIdsToFieldEdit = (
  argIds: string[],
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  let fieldEdit = state.fieldEdits[fieldId];
  const field = state.fields[fieldId];

  const deletedArgIds = argIds.filter(
    (argId) => state.argEdits[argId]?.isDeleted,
  );

  if (fieldEdit?.createdArgIds) {
    fieldEdit = fsf.set(
      fieldEdit,
      'createdArgIds',
      fsf.unsetEach(fieldEdit.createdArgIds, argIds),
      fieldEditDef,
    );
  }
  if (deletedArgIds.length) {
    if (!fieldEdit && field) {
      fieldEdit = {
        id: fieldId,
        nodeId: field.nodeId,
        deletedArgIds,
      };
    } else {
      fieldEdit = fsf.set(
        fieldEdit,
        'deletedArgIds',
        fsf.setEach(fieldEdit?.deletedArgIds || [], deletedArgIds),
        fieldEditDef,
      );
    }
  }

  return fsf.set(
    state,
    'fieldEdits',
    fsf.set(state.fieldEdits, fieldEdit, fieldEditDef),
    stateDef,
  );
};

export const addCreatedArgIdsToFieldEdit = (
  argIds: string[],
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  const fieldEdit = state.fieldEdits[fieldId];
  const field = state.fields[fieldId];

  const createdArgIds = argIds.filter((argId) => state.argEdits[argId]?.isNew);

  const patchedFieldEdit = fsf.patch(
    fieldEdit || { id: fieldId, nodeId: field?.nodeId },
    {
      createdArgIds: createdArgIds.length
        ? fsf.setEach(fieldEdit?.createdArgIds || [], createdArgIds)
        : undefined,
      deletedArgIds: fieldEdit?.deletedArgIds
        ? fsf.unsetEach(fieldEdit.deletedArgIds, argIds)
        : undefined,
    },
    fieldEditDef,
  );

  return fsf.set(
    state,
    'fieldEdits',
    fsf.set(state.fieldEdits, patchedFieldEdit, fieldEditDef),
    stateDef,
  );
};

export const unsetEmptyFieldEditArgArrays = (
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  let fieldEdit = state.fieldEdits[fieldId];
  if (!fieldEdit) return state;
  if (
    (!fieldEdit.createdArgIds || fieldEdit.createdArgIds.length) &&
    (!fieldEdit.deletedArgIds || fieldEdit.deletedArgIds.length)
  ) {
    return state;
  }

  // unset fieldEdit arg arrays if empty
  if (!fieldEdit.deletedArgIds?.length) {
    fieldEdit = fsf.unset(fieldEdit, 'deletedArgIds', fieldEditDef);
  }
  if (!fieldEdit.createdArgIds?.length) {
    fieldEdit = fsf.unset(fieldEdit, 'createdArgIds', fieldEditDef);
  }

  return fsf.set(
    state,
    'fieldEdits',
    fsf.set(state.fieldEdits, fieldEdit, fieldEditDef),
    stateDef,
  );
};

export const unsetUselessFieldEdit = (
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  const fieldEdit = state.fieldEdits[fieldId];
  if (!fieldEdit) return state;
  if (fieldEdit.isNew) return state;
  if (fieldEdit.isDeleted) return state;
  if (fieldEdit.createdArgIds?.length) return state;
  if (fieldEdit.deletedArgIds?.length) return state;
  const field = state.fields[fieldId];
  if (!field) return state;
  if (field === fsf.patch(field, fieldEdit, fieldDef)) return state;

  return fsf.set(
    state,
    'fieldEdits',
    fsf.unset(state.fieldEdits, fieldEdit.id),
    stateDef,
  );
};
