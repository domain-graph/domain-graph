import {
  define,
  key,
  required,
  optional,
  indexOf,
  Index,
  array,
  unset,
  set,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

import {
  Entity,
  PatchEachItem,
  PatchItem,
  Reducer,
  ReducerState,
  SetEachItem,
  SetItem,
  UnsetEachItem,
  UnsetItem,
} from '../entity';

export type Field = {
  id: string;
  nodeId: string;
  edgeId?: string;
  isReverse?: boolean;
  name: string;
  description?: string;
  typeKind: SpecificFieldType['kind'];
  typeName: SpecificFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
};

export const fieldDef = define<Field>({
  id: key(),
  nodeId: required(),
  edgeId: optional(),
  isReverse: optional(),
  name: required(),
  description: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
});

export type ByNodeId = {
  nodeId: string;
  fieldIds: string[];
};

export const byNodeIdDef = define<ByNodeId>({
  nodeId: key(),
  fieldIds: required(),
});

export type FieldsState = {
  ix_nodeId: Record<string, ByNodeId>;
  data: Record<string, Field>;
};

const stateDef = define<FieldsState>({
  ix_nodeId: required(array()),
  data: required(indexOf(fieldDef)),
});

export const fields = new Entity('FIELDS', stateDef, fieldDef, {
  ix_nodeId: {},
  data: {},
});

export const reducer: Reducer<'FIELDS', Field, FieldsState> = (
  originalState,
  action,
) => {
  const state = fields.standardReducer(originalState, action);

  if (state === originalState) return originalState;
  switch (action.type) {
    case fields.PATCH: {
      const { payload } = action as PatchItem<'FIELDS', Field>;
      const originalNodeId = originalState.data[payload.key]?.nodeId;
      const nodeId = state.data[payload.key]?.nodeId;
      if (originalNodeId === nodeId) return state;

      return indexFieldId(
        deindexFieldId(state, originalNodeId, payload.key),
        payload.key,
      );
    }
    case fields.PATCHEACH: {
      const { payload } = action as PatchEachItem<'FIELDS', Field>;

      let nextState = state;

      for (const fieldId of Object.keys(payload)) {
        const originalNodeId = originalState.data[fieldId]?.nodeId;
        const nodeId = state.data[fieldId]?.nodeId;
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
      const nodeId = state.data[fieldKey]?.nodeId;
      if (originalNodeId === nodeId) return state;

      return indexFieldId(
        deindexFieldId(state, originalNodeId, fieldKey),
        fieldKey,
      );
    }
    case fields.SETEACH: {
      const { payload } = action as SetEachItem<'FIELDS', Field>;

      let nextState = state;

      for (const fieldKey of Object.keys(payload)) {
        const originalNodeId = originalState.data[fieldKey]?.nodeId;
        const nodeId = state.data[fieldKey]?.nodeId;
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
        state,
        originalState.data[payload]?.nodeId,
        payload,
      );
    }
    case fields.UNSETEACH: {
      const { payload } = action as UnsetEachItem<'FIELDS'>;

      let nextState = state;

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
      return state;
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
