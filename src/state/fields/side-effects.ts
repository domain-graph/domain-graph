import { unset, set } from 'flux-standard-functions';

import { byNodeIdDef, Field, fieldDef, fields, FieldsState } from '.';
import {
  PatchEachItem,
  PatchItem,
  SetEachItem,
  SetItem,
  StandardSideEffect,
  UnsetEachItem,
  UnsetItem,
} from '../entity';

export const buildIndexSideEffect: StandardSideEffect<
  'FIELDS',
  Field,
  FieldsState
> = (originalState, currentState, action) => {
  if (currentState === originalState) return originalState;
  switch (action.type) {
    case fields.PATCH: {
      const { payload } = action as PatchItem<'FIELDS', Field>;
      const originalNodeId = originalState.data[payload.key]?.nodeId;
      const nodeId = currentState.data[payload.key]?.nodeId;
      if (originalNodeId === nodeId) return currentState;

      return indexFieldId(
        deindexFieldId(currentState, originalNodeId, payload.key),
        payload.key,
      );
    }
    case fields.PATCHEACH: {
      const { payload } = action as PatchEachItem<'FIELDS', Field>;

      let nextState = currentState;

      for (const fieldId of Object.keys(payload)) {
        const originalNodeId = originalState.data[fieldId]?.nodeId;
        const nodeId = currentState.data[fieldId]?.nodeId;
        if (originalNodeId === nodeId) continue;

        nextState = indexFieldId(
          deindexFieldId(nextState, originalNodeId, fieldId),
          fieldId,
        );
      }

      return nextState;
    }
    case fields.SET: {
      const { payload } = action as SetItem<'FIELDS', Field>;
      const fieldKey = fieldDef.getKey(payload);
      const originalNodeId = originalState.data[fieldKey]?.nodeId;
      const nodeId = currentState.data[fieldKey]?.nodeId;
      if (originalNodeId === nodeId) return currentState;

      return indexFieldId(
        deindexFieldId(currentState, originalNodeId, fieldKey),
        fieldKey,
      );
    }
    case fields.SETEACH: {
      const { payload } = action as SetEachItem<'FIELDS', Field>;

      let nextState = currentState;

      for (const fieldKey of Object.keys(payload)) {
        const originalNodeId = originalState.data[fieldKey]?.nodeId;
        const nodeId = currentState.data[fieldKey]?.nodeId;
        if (originalNodeId === nodeId) continue;

        nextState = indexFieldId(
          deindexFieldId(nextState, originalNodeId, fieldKey),
          fieldKey,
        );
      }

      return nextState;
    }
    case fields.UNSET: {
      const { payload } = action as UnsetItem<'FIELDS'>;

      return deindexFieldId(
        currentState,
        originalState.data[payload]?.nodeId,
        payload,
      );
    }
    case fields.UNSETEACH: {
      const { payload } = action as UnsetEachItem<'FIELDS'>;

      let nextState = currentState;

      for (const fieldId of payload) {
        nextState = deindexFieldId(
          nextState,
          originalState.data[fieldId]?.nodeId,
          fieldId,
        );
      }

      return nextState;
    }
    default:
      return currentState;
  }
};

function indexFieldId(state: FieldsState, fieldId: string): FieldsState {
  const nodeId = state.data[fieldId]?.nodeId;
  if (!nodeId) return state;

  const fieldIds = set(state.ix_nodeId[nodeId]?.fieldIds || [], fieldId);
  if (fieldIds === state.ix_nodeId[nodeId]?.fieldIds) return state;

  if (state.ix_nodeId[nodeId]) {
    return {
      ...state,
      ix_nodeId: {
        ...state.ix_nodeId,
        [nodeId]: set(
          state.ix_nodeId[nodeId],
          'fieldIds',
          fieldIds,
          byNodeIdDef,
        ),
      },
    };
  } else {
    return {
      ...state,
      ix_nodeId: {
        ...state.ix_nodeId,
        [nodeId]: {
          nodeId,
          fieldIds,
        },
      },
    };
  }
}

function deindexFieldId(
  state: FieldsState,
  originalNodeId: string | undefined,
  fieldId: string,
): FieldsState {
  if (!originalNodeId) return state;

  const fieldIds = unset(state.ix_nodeId[originalNodeId].fieldIds, fieldId);
  if (fieldIds === state.ix_nodeId[originalNodeId].fieldIds) return state;

  if (fieldIds.length) {
    return {
      ...state,
      ix_nodeId: {
        ...state.ix_nodeId,
        [originalNodeId]: set(
          state.ix_nodeId[originalNodeId],
          'fieldIds',
          fieldIds,
          byNodeIdDef,
        ),
      },
    };
  } else {
    return {
      ...state,
      ix_nodeId: unset(state.ix_nodeId, originalNodeId),
    };
  }
}
