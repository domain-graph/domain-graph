import * as fsf from 'flux-standard-functions';

import { chainReducers, Reducer } from '../../state-utils';
import { Edge, EdgeEdit, GraphState, stateDef } from '../types';
import {
  unsetArgEdits,
  setFieldAsDeleted,
  addDeletedFieldIdsToNodeEdit,
  unsetUselessNodeEdit,
  addDeletedFieldIdsToEdgeEdit,
  unsetUselessEdgeEdit,
  unsetFieldIdsFromNodeEdit,
  unsetFieldIdsFromEdgeEdit,
  unsetEmptyEdgeEditFieldArrays,
  unsetEmptyNodeEditFieldArrays,
  patchFieldEdit,
  unsetEachFieldEdit,
  addCreatedFieldIdsToNodeEdit,
  setEdgeWithoutFieldsAsDeleted,
  addCreatedFieldIdsToEdgeEdit,
} from '../higher-order-reducers';
import { Action } from '../reducer';
import { NewField } from './types';

export function reducer(state: GraphState, action: Action): GraphState {
  switch (action.type) {
    case 'edit/delete_field': {
      const { payload: fieldId } = action;

      const fieldEdit = state.fieldEdits[fieldId];
      if (fieldEdit?.isDeleted) return state;

      const field = state.fields[fieldId];
      if (!field && !fieldEdit) return state;

      const nodeId = field?.nodeId || fieldEdit?.nodeId;
      const edgeId = field?.edgeId || fieldEdit?.edgeId;

      return chainReducers(
        unsetArgEdits(fieldId),
        setFieldAsDeleted(fieldId),
        addDeletedFieldIdsToNodeEdit([fieldId], nodeId),
        addDeletedFieldIdsToEdgeEdit([fieldId], edgeId),
        setEdgeWithoutFieldsAsDeleted(edgeId),
        unsetUselessNodeEdit(nodeId),
        unsetUselessEdgeEdit(edgeId),
      )(state, action);
    }
    case 'edit/restore_field': {
      const { payload: fieldId } = action;
      const field = state.fields[fieldId];
      if (!field) return state;

      const fieldEdit = state.fieldEdits[fieldId];
      if (fieldEdit?.isNew) return state;

      const nodeId = field?.nodeId || fieldEdit?.nodeId;
      const edgeId = field?.edgeId || fieldEdit?.edgeId;

      // TODO: handle edges
      return chainReducers(
        unsetArgEdits(fieldId),
        unsetEachFieldEdit([fieldId]),
        unsetFieldIdsFromNodeEdit([fieldId], nodeId),
        unsetFieldIdsFromEdgeEdit([fieldId], edgeId),
        undeleteEdgeEditForFieldId(edgeId, fieldId),
        unsetEmptyNodeEditFieldArrays(fieldId),
        unsetEmptyEdgeEditFieldArrays(edgeId),
        unsetUselessNodeEdit(nodeId),
        unsetUselessEdgeEdit(edgeId),
      )(state, action);
    }
    case 'edit/edit_field': {
      const { payload } = action;
      const fieldEdit = state.fieldEdits[payload.id];
      if (fieldEdit?.isDeleted) return state;

      const field = state.fields[payload.id];
      if (!field && !fieldEdit) return state;
      const nodeId = field?.nodeId || fieldEdit?.nodeId;

      return chainReducers(
        patchFieldEdit({ ...payload, nodeId, isDeleted: false }),
      )(state, action);
    }
    case 'edit/create_field': {
      const { payload } = action;

      const fieldEdit = state.fieldEdits[payload.id];
      if (fieldEdit) return state;

      const field = state.fields[payload.id];
      if (field) return state;

      const edgeInfo = getEdgeInfo(state, payload);

      let edgeId = edgeInfo.edgeId;
      const { sourceNodeId, targetNodeId, isReverse } = edgeInfo;
      let nextState = state;

      if (targetNodeId && !edgeId) {
        // TODO: correctly generate ID
        edgeId = `${sourceNodeId}>${targetNodeId}`;

        const edgeEdit: EdgeEdit = {
          id: edgeId,
          sourceNodeId,
          targetNodeId,
          isNew: true,
        };

        nextState = fsf.patch(
          state,
          { edgeEdits: { [edgeEdit.id]: edgeEdit } },
          stateDef,
        );
      }

      return chainReducers(
        patchFieldEdit({ ...payload, edgeId, isReverse, isNew: true }),
        addCreatedFieldIdsToNodeEdit([payload.id], payload.nodeId),
        addCreatedFieldIdsToEdgeEdit([payload.id], edgeId),
      )(nextState, action);
    }
    default:
      return state;
  }
}

function getEdgeInfo(
  state: GraphState,
  newField: NewField,
): {
  edgeId: string | undefined;
  sourceNodeId: string;
  targetNodeId: string | undefined;
  isReverse: boolean | undefined;
} {
  const sourceNodeId = newField.nodeId;
  const targetNodeId =
    newField.typeKind === 'OBJECT' || newField.typeKind === 'INTERFACE'
      ? newField.typeName
      : undefined;

  if (!targetNodeId) {
    return {
      edgeId: undefined,
      isReverse: undefined,
      sourceNodeId,
      targetNodeId,
    };
  }

  const forwardEdge = fsf
    .deindex(state.edges)
    .find(
      (edge) =>
        edge.sourceNodeId === sourceNodeId &&
        edge.targetNodeId === targetNodeId,
    );

  if (forwardEdge) {
    return {
      edgeId: forwardEdge.id,
      isReverse: false,
      sourceNodeId,
      targetNodeId,
    };
  }

  const forwardEdgeEdit = fsf
    .deindex(state.edgeEdits)
    .find(
      (edge) =>
        edge.sourceNodeId === sourceNodeId &&
        edge.targetNodeId === targetNodeId,
    );

  if (forwardEdgeEdit) {
    return {
      edgeId: forwardEdgeEdit.id,
      isReverse: false,
      sourceNodeId,
      targetNodeId,
    };
  }

  const reverseEdge = fsf
    .deindex(state.edges)
    .find(
      (edge) =>
        edge.sourceNodeId === targetNodeId &&
        edge.targetNodeId === sourceNodeId,
    );

  if (reverseEdge) {
    return {
      edgeId: reverseEdge.id,
      isReverse: true,
      sourceNodeId,
      targetNodeId,
    };
  }

  const reverseEdgeEdit = fsf
    .deindex(state.edgeEdits)
    .find(
      (edge) =>
        edge.sourceNodeId === targetNodeId &&
        edge.targetNodeId === sourceNodeId,
    );

  if (reverseEdgeEdit) {
    return {
      edgeId: reverseEdgeEdit.id,
      isReverse: true,
      sourceNodeId,
      targetNodeId,
    };
  }

  return {
    edgeId: undefined,
    isReverse: false,
    sourceNodeId,
    targetNodeId,
  };
}

const undeleteEdgeEditForFieldId = (
  edgeId: string | undefined,
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;

  const edgeEdit = state.edgeEdits[edgeId];
  if (!edgeEdit?.isDeleted) return state;

  const edge = state.edges[edgeId];
  if (!edge) return state;

  const fieldIds = new Set(edge.fieldIds);
  fieldIds.delete(fieldId);

  return fsf.patch(
    state,
    {
      edgeEdits: {
        [edgeId]: {
          isDeleted: false,
          deletedFieldIds: fieldIds.size ? Array.from(fieldIds) : undefined,
        },
      },
    },
    stateDef,
  );
};
