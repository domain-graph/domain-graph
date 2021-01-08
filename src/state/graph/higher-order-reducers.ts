import * as fsf from 'flux-standard-functions';

import { Reducer } from '../state-utils';
import {
  edgeDef,
  EdgeEdit,
  edgeEditDef,
  GraphState,
  MutableEntity,
  stateDef,
  VisibleNode,
  visibleNodeDef,
} from './types';
import { argDef, ArgEdit, argEditDef } from './args/types';
import { fieldEditDef, fieldDef, FieldEdit } from './fields/types';
import { nodeDef, nodeEditDef } from './nodes/types';
import { Action } from './reducer';

export const setArgAsDeleted = (argId: string): Reducer<GraphState, any> => (
  state,
) => {
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

export const setFieldAsDeleted = (
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  const field = state.fields[fieldId];
  const fieldEdit = state.fieldEdits[fieldId];

  if (!field && !fieldEdit) return state;

  if (fieldEdit?.isNew) {
    return fsf.set(
      state,
      'fieldEdits',
      fsf.unset(state.fieldEdits, fieldId),
      stateDef,
    );
  } else if (field && !fieldEdit?.isDeleted) {
    return fsf.set(
      state,
      'fieldEdits',
      fsf.set(
        state.fieldEdits,
        { id: fieldId, nodeId: field.nodeId, isDeleted: true },
        fieldEditDef,
      ),
      stateDef,
    );
  }
  return state;
};

export const unsetArgEdits = (fieldId: string): Reducer<GraphState, any> => (
  state,
  action,
) => {
  const fieldEdit = state.fieldEdits[fieldId];
  if (fieldEdit?.isDeleted) return state;

  const field = state.fields[fieldId];
  if (!field && !fieldEdit) return state;

  const argIds = new Set([
    ...(field?.argIds || []),
    ...(fieldEdit?.createdArgIds || []),
    ...(fieldEdit?.deletedArgIds || []),
  ]);

  return unsetEachArgEdit(Array.from(argIds))(state, action);
};

export const unsetEachArgEdit = (
  argIds: string[],
): Reducer<GraphState, any> => (state) => {
  if (!argIds?.length) return state;
  if (!argIds.some((argId) => state.argEdits[argId])) return state;

  return fsf.set(
    state,
    'argEdits',
    fsf.unsetEach(state.argEdits, argIds),
    stateDef,
  );
};

export const unsetEachFieldEdit = (
  fieldIds: string[],
): Reducer<GraphState, any> => (state) => {
  if (!fieldIds?.length) return state;
  if (!fieldIds.some((fieldId) => state.fieldEdits[fieldId])) return state;

  return fsf.set(
    state,
    'fieldEdits',
    fsf.unsetEach(state.fieldEdits, fieldIds),
    stateDef,
  );
};

export const addDeletedArgIdsToFieldEdit = (
  argIds: string[],
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  if (!argIds.length) return state;
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

export const addDeletedFieldIdsToNodeEdit = (
  fieldIds: string[],
  nodeId: string,
): Reducer<GraphState, any> => (state) => {
  if (!fieldIds.length) return state;
  let nodeEdit = state.nodeEdits[nodeId];
  const node = state.nodes[nodeId];

  const deletedFieldIds = fieldIds.filter(
    (fieldId) => state.fieldEdits[fieldId]?.isDeleted,
  );

  if (nodeEdit?.createdFieldIds) {
    nodeEdit = fsf.set(
      nodeEdit,
      'createdFieldIds',
      fsf.unsetEach(nodeEdit.createdFieldIds, fieldIds),
      nodeEditDef,
    );
  }
  if (deletedFieldIds.length) {
    if (!nodeEdit && node) {
      nodeEdit = {
        id: nodeId,
        deletedFieldIds,
      };
    } else {
      nodeEdit = fsf.set(
        nodeEdit,
        'deletedFieldIds',
        fsf.setEach(nodeEdit?.deletedFieldIds || [], deletedFieldIds),
        nodeEditDef,
      );
    }
  }

  return fsf.set(
    state,
    'nodeEdits',
    fsf.set(state.nodeEdits, nodeEdit, nodeEditDef),
    stateDef,
  );
};

export const addDeletedFieldIdsToEdgeEdit = (
  fieldIds: string[],
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;
  if (!fieldIds.length) return state;
  let edgeEdit = state.edgeEdits[edgeId];
  const edge = state.edges[edgeId];

  const deletedFieldIds = fieldIds.filter(
    (fieldId) => state.fieldEdits[fieldId]?.isDeleted,
  );

  if (edgeEdit?.createdFieldIds) {
    edgeEdit = fsf.set(
      edgeEdit,
      'createdFieldIds',
      fsf.unsetEach(edgeEdit.createdFieldIds, fieldIds),
      edgeEditDef,
    );
  }
  if (deletedFieldIds.length) {
    if (!edgeEdit && edge) {
      edgeEdit = {
        id: edgeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        deletedFieldIds,
      };
    } else {
      edgeEdit = fsf.set(
        edgeEdit,
        'deletedFieldIds',
        fsf.setEach(edgeEdit?.deletedFieldIds || [], deletedFieldIds),
        edgeEditDef,
      );
    }
  }

  return fsf.set(
    state,
    'edgeEdits',
    fsf.set(state.edgeEdits, edgeEdit, edgeEditDef),
    stateDef,
  );
};

export const addCreatedArgIdsToFieldEdit = (
  argIds: string[],
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  if (!argIds.length) return state;
  let fieldEdit = state.fieldEdits[fieldId];
  const field = state.fields[fieldId];

  const createdArgIds = argIds.filter((argId) => state.argEdits[argId]?.isNew);

  if (fieldEdit?.deletedArgIds) {
    fieldEdit = fsf.set(
      fieldEdit,
      'deletedArgIds',
      fsf.unsetEach(fieldEdit.deletedArgIds, argIds),
      fieldEditDef,
    );
  }
  if (createdArgIds.length) {
    if (!fieldEdit && field) {
      fieldEdit = {
        id: fieldId,
        nodeId: field.nodeId,
        createdArgIds,
      };
    } else {
      fieldEdit = fsf.set(
        fieldEdit,
        'createdArgIds',
        fsf.setEach(fieldEdit?.createdArgIds || [], createdArgIds),
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

export const addCreatedFieldIdsToNodeEdit = (
  fieldIds: string[],
  nodeId: string,
): Reducer<GraphState, any> => (state) => {
  if (!fieldIds.length) return state;
  let nodeEdit = state.nodeEdits[nodeId];
  const node = state.nodes[nodeId];

  const createdFieldIds = fieldIds.filter(
    (fieldId) => state.fieldEdits[fieldId]?.isNew,
  );

  if (nodeEdit?.deletedFieldIds) {
    nodeEdit = fsf.set(
      nodeEdit,
      'deletedFieldIds',
      fsf.unsetEach(nodeEdit.deletedFieldIds, fieldIds),
      nodeEditDef,
    );
  }
  if (createdFieldIds.length) {
    if (!nodeEdit && node) {
      nodeEdit = {
        id: nodeId,
        createdFieldIds,
      };
    } else {
      nodeEdit = fsf.set(
        nodeEdit,
        'createdFieldIds',
        fsf.setEach(nodeEdit?.createdFieldIds || [], createdFieldIds),
        nodeEditDef,
      );
    }
  }

  return fsf.set(
    state,
    'nodeEdits',
    fsf.set(state.nodeEdits, nodeEdit, nodeEditDef),
    stateDef,
  );
};

export const addCreatedFieldIdsToEdgeEdit = (
  fieldIds: string[],
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;
  if (!fieldIds.length) return state;
  let edgeEdit = state.edgeEdits[edgeId];
  const edge = state.edges[edgeId];

  const createdFieldIds = fieldIds.filter(
    (fieldId) => state.fieldEdits[fieldId]?.isNew,
  );

  if (edgeEdit?.deletedFieldIds) {
    edgeEdit = fsf.set(
      edgeEdit,
      'deletedFieldIds',
      fsf.unsetEach(edgeEdit.deletedFieldIds, fieldIds),
      edgeEditDef,
    );
  }
  if (createdFieldIds.length) {
    if (!edgeEdit && edge) {
      edgeEdit = {
        id: edgeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        createdFieldIds,
      };
    } else {
      edgeEdit = fsf.set(
        edgeEdit,
        'createdFieldIds',
        fsf.setEach(edgeEdit?.createdFieldIds || [], createdFieldIds),
        edgeEditDef,
      );
    }
  }

  return fsf.set(
    state,
    'edgeEdits',
    fsf.set(state.edgeEdits, edgeEdit, edgeEditDef),
    stateDef,
  );
};

export const setEdgeWithoutFieldsAsDeleted = (
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state, action) => {
  if (!edgeId) return state;

  const edge = state.edges[edgeId];
  const edgeEdit = state.edgeEdits[edgeId];
  if (!edge && !edgeEdit) return state;

  const deletedFieldIds = new Set(edgeEdit?.deletedFieldIds || []);

  const fieldIds = new Set(
    [...(edge?.fieldIds || []), ...(edgeEdit?.createdFieldIds || [])].filter(
      (fieldId) => !deletedFieldIds.has(fieldId),
    ),
  );

  if (!fieldIds.size) {
    if (edge) {
      return patchEdgeEdit({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        isDeleted: true,
      })(state, action);
    } else if (edgeEdit.isNew) {
      return fsf.set(
        state,
        'edgeEdits',
        fsf.unset(state.edgeEdits, edgeId),
        stateDef,
      );
    }
  }

  return state;
};

export const unsetArgIdsFromFieldEdit = (
  argIds: string[],
  fieldId: string,
): Reducer<GraphState, any> => (state) => {
  if (!argIds.length) return state;
  const fieldEdit = state.fieldEdits[fieldId];
  if (!fieldEdit) return state;

  let nextFieldEdit = fieldEdit;
  if (fieldEdit.createdArgIds) {
    nextFieldEdit = fsf.set(
      fieldEdit,
      'createdArgIds',
      fsf.unsetEach(fieldEdit.createdArgIds, argIds),
      fieldEditDef,
    );
  }
  if (fieldEdit.deletedArgIds) {
    nextFieldEdit = fsf.set(
      fieldEdit,
      'deletedArgIds',
      fsf.unsetEach(fieldEdit.deletedArgIds, argIds),
      fieldEditDef,
    );
  }
  if (nextFieldEdit === fieldEdit) return state;

  return fsf.set(
    state,
    'fieldEdits',
    fsf.set(state.fieldEdits, nextFieldEdit, fieldEditDef),
    stateDef,
  );
};

export const unsetFieldIdsFromNodeEdit = (
  fieldIds: string[],
  nodeId: string,
): Reducer<GraphState, any> => (state) => {
  if (!fieldIds.length) return state;
  const nodeEdit = state.nodeEdits[nodeId];
  if (!nodeEdit) return state;

  let nextNodeEdit = nodeEdit;
  if (nodeEdit.createdFieldIds) {
    nextNodeEdit = fsf.set(
      nodeEdit,
      'createdFieldIds',
      fsf.unsetEach(nodeEdit.createdFieldIds, fieldIds),
      nodeEditDef,
    );
  }
  if (nodeEdit.deletedFieldIds) {
    nextNodeEdit = fsf.set(
      nodeEdit,
      'deletedFieldIds',
      fsf.unsetEach(nodeEdit.deletedFieldIds, fieldIds),
      nodeEditDef,
    );
  }
  if (nextNodeEdit === nodeEdit) return state;

  return fsf.set(
    state,
    'nodeEdits',
    fsf.set(state.nodeEdits, nextNodeEdit, nodeEditDef),
    stateDef,
  );
};

export const unsetFieldIdsFromEdgeEdit = (
  fieldIds: string[],
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;
  if (!fieldIds.length) return state;
  const edgeEdit = state.edgeEdits[edgeId];
  if (!edgeEdit) return state;

  let nextEdgeEdit = edgeEdit;
  if (edgeEdit.createdFieldIds) {
    nextEdgeEdit = fsf.set(
      edgeEdit,
      'createdFieldIds',
      fsf.unsetEach(edgeEdit.createdFieldIds, fieldIds),
      edgeEditDef,
    );
  }
  if (edgeEdit.deletedFieldIds) {
    nextEdgeEdit = fsf.set(
      edgeEdit,
      'deletedFieldIds',
      fsf.unsetEach(edgeEdit.deletedFieldIds, fieldIds),
      edgeEditDef,
    );
  }
  if (nextEdgeEdit === edgeEdit) return state;

  return fsf.set(
    state,
    'edgeEdits',
    fsf.set(state.edgeEdits, nextEdgeEdit, edgeEditDef),
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
  if (fieldEdit.deletedArgIds && !fieldEdit.deletedArgIds.length) {
    fieldEdit = fsf.unset(fieldEdit, 'deletedArgIds', fieldEditDef);
  }
  if (fieldEdit.createdArgIds && !fieldEdit.createdArgIds.length) {
    fieldEdit = fsf.unset(fieldEdit, 'createdArgIds', fieldEditDef);
  }

  return fsf.set(
    state,
    'fieldEdits',
    fsf.set(state.fieldEdits, fieldEdit, fieldEditDef),
    stateDef,
  );
};

export const unsetEmptyNodeEditFieldArrays = (
  nodeId: string,
): Reducer<GraphState, any> => (state) => {
  let nodeEdit = state.nodeEdits[nodeId];
  if (!nodeEdit) return state;
  if (
    (!nodeEdit.createdFieldIds || nodeEdit.createdFieldIds.length) &&
    (!nodeEdit.deletedFieldIds || nodeEdit.deletedFieldIds.length)
  ) {
    return state;
  }

  if (nodeEdit.deletedFieldIds && !nodeEdit.deletedFieldIds.length) {
    nodeEdit = fsf.unset(nodeEdit, 'deletedFieldIds', nodeEditDef);
  }
  if (nodeEdit.createdFieldIds && !nodeEdit.createdFieldIds.length) {
    nodeEdit = fsf.unset(nodeEdit, 'createdFieldIds', nodeEditDef);
  }

  return fsf.set(
    state,
    'nodeEdits',
    fsf.set(state.nodeEdits, nodeEdit, nodeEditDef),
    stateDef,
  );
};

export const unsetEmptyEdgeEditFieldArrays = (
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;
  let edgeEdit = state.edgeEdits[edgeId];
  if (!edgeEdit) return state;
  if (
    (!edgeEdit.createdFieldIds || edgeEdit.createdFieldIds.length) &&
    (!edgeEdit.deletedFieldIds || edgeEdit.deletedFieldIds.length)
  ) {
    return state;
  }

  if (edgeEdit.deletedFieldIds && !edgeEdit.deletedFieldIds.length) {
    edgeEdit = fsf.unset(edgeEdit, 'deletedFieldIds', edgeEditDef);
  }
  if (edgeEdit.createdFieldIds && !edgeEdit.createdFieldIds.length) {
    edgeEdit = fsf.unset(edgeEdit, 'createdFieldIds', edgeEditDef);
  }

  return fsf.set(
    state,
    'edgeEdits',
    fsf.set(state.edgeEdits, edgeEdit, edgeEditDef),
    stateDef,
  );
};

export const unsetUselessArgEdit = (
  argId: string,
): Reducer<GraphState, any> => (state) => {
  const argEdit = state.argEdits[argId];
  if (!argEdit) return state;
  if (argEdit.isNew) return state;
  if (argEdit.isDeleted) return state;
  const arg = state.args[argId];
  if (!arg) return state;
  if (arg !== fsf.patch(arg, argEdit, argDef)) return state;

  return fsf.set(
    state,
    'argEdits',
    fsf.unset(state.argEdits, argEdit.id),
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
  if (field !== fsf.patch(field, fieldEdit, fieldDef)) return state;

  return fsf.set(
    state,
    'fieldEdits',
    fsf.unset(state.fieldEdits, fieldEdit.id),
    stateDef,
  );
};

export const unsetUselessNodeEdit = (
  nodeId: string,
): Reducer<GraphState, any> => (state) => {
  const nodeEdit = state.nodeEdits[nodeId];
  if (!nodeEdit) return state;
  if (nodeEdit.isNew) return state;
  if (nodeEdit.isDeleted) return state;
  if (nodeEdit.createdFieldIds?.length) return state;
  if (nodeEdit.deletedFieldIds?.length) return state;
  const node = state.nodes[nodeId];
  if (!node) return state;
  if (node !== fsf.patch(node, nodeEdit, nodeDef)) return state;

  return fsf.set(
    state,
    'nodeEdits',
    fsf.unset(state.nodeEdits, nodeEdit.id),
    stateDef,
  );
};

export const unsetUselessEdgeEdit = (
  edgeId: string | undefined,
): Reducer<GraphState, any> => (state) => {
  if (!edgeId) return state;
  const edgeEdit = state.edgeEdits[edgeId];
  if (!edgeEdit) return state;
  if (edgeEdit.isNew) return state;
  if (edgeEdit.isDeleted) return state;
  if (edgeEdit.createdFieldIds?.length) return state;
  if (edgeEdit.deletedFieldIds?.length) return state;
  const edge = state.edges[edgeId];
  if (!edge) return state;
  if (edge !== fsf.patch(edge, edgeEdit, edgeDef)) return state;

  return fsf.set(
    state,
    'edgeEdits',
    fsf.unset(state.edgeEdits, edgeEdit.id),
    stateDef,
  );
};

export const patchArgEdit = (
  argEdit: MutableEntity<ArgEdit>,
): Reducer<GraphState, any> => (state) => {
  // TODO: don't patch useless edit
  return fsf.patch(
    state,
    {
      argEdits: {
        [argEdit.id]: argEdit,
      },
    },
    stateDef,
  );
};

export const patchFieldEdit = (
  fieldEdit: MutableEntity<FieldEdit>,
): Reducer<GraphState, any> => (state, action) => {
  const field = state.fields[fieldEdit.id];
  if (field && field === fsf.patch(field, fieldEdit, fieldDef)) {
    return unsetUselessFieldEdit(fieldEdit.id)(state, action);
  } else {
    return fsf.patch(
      state,
      {
        fieldEdits: {
          [fieldEdit.id]: fieldEdit,
        },
      },
      stateDef,
    );
  }
};

export const patchEdgeEdit = (
  edgeEdit: MutableEntity<EdgeEdit>,
): Reducer<GraphState, any> => (state, action) => {
  const edge = state.edges[edgeEdit.id];
  if (edge && edge === fsf.patch(edge, edgeEdit, edgeDef)) {
    return unsetUselessEdgeEdit(edgeEdit.id)(state, action);
  } else {
    return fsf.patch(
      state,
      {
        edgeEdits: {
          [edgeEdit.id]: edgeEdit,
        },
      },
      stateDef,
    );
  }
};

export const hideNodes = (
  nodeIds: Set<string>,
): Reducer<GraphState, Action> => (state) => {
  let nextState = state;
  const edgeIdsToHide = state.visibleEdgeIds
    .map((edgeId) => state.edges[edgeId])
    .filter(
      (edge) =>
        nodeIds.has(edge.sourceNodeId) || nodeIds.has(edge.targetNodeId),
    )
    .map((edge) => edge.id);

  // TODO: avoid unnecessary spread (issue: #45)
  nextState = {
    ...nextState,
    visibleEdgeIds: fsf.unsetEach(
      nextState.visibleEdgeIds,
      Array.from(edgeIdsToHide),
    ),
    visibleNodes: fsf.unsetEach(nextState.visibleNodes, Array.from(nodeIds)),
  };

  if (nodeIds.has(nextState.selectedSourceNodeId || '')) {
    nextState = fsf.unset(nextState, 'selectedSourceNodeId', stateDef);
    nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
    nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
  } else if (nodeIds.has(nextState.selectedTargetNodeId || '')) {
    nextState = fsf.unset(nextState, 'selectedFieldId', stateDef);
    nextState = fsf.unset(nextState, 'selectedTargetNodeId', stateDef);
  }

  return nextState;
};

export const showNodes = (
  nodeIds: Set<string>,
  data?: Record<string, VisibleNode>,
): Reducer<GraphState, Action> => (state) => {
  let nextState = state;

  const visibleEdgeIds = new Set(nextState.visibleEdgeIds);

  const nodesToShow = fsf.index(
    Array.from(nodeIds)
      .filter(
        (nodeId) => !nextState.visibleNodes[nodeId] && nextState.nodes[nodeId],
      )
      .map((nodeId) => data?.[nodeId] || { id: nodeId, isPinned: false }),
    visibleNodeDef,
  );

  const edgeIdsToShow = fsf
    .deindex(nextState.edges)
    .filter(
      (edge) =>
        !visibleEdgeIds.has(edge.id) &&
        (nodeIds.has(edge.sourceNodeId) ||
          nextState.visibleNodes[edge.sourceNodeId]) &&
        (nodeIds.has(edge.targetNodeId) ||
          nextState.visibleNodes[edge.targetNodeId]),
    )
    .map((edge) => edge.id);

  // TODO: avoid unnecessary spread (issue: #45)
  nextState = {
    ...state,
    visibleEdgeIds: fsf.setEach(nextState.visibleEdgeIds, edgeIdsToShow),
    visibleNodes: fsf.patchEach(
      nextState.visibleNodes,
      nodesToShow,
      visibleNodeDef,
    ),
  };

  return nextState;
};
