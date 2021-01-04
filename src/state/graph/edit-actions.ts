import {
  ArgEdit,
  FieldEdit,
  Mutable,
  NewArg,
  NewField,
  NewNode,
  NodeEdit,
} from './types';

export const deleteNode = (nodeId: string) => ({
  type: 'edit/delete_node' as const,
  payload: nodeId,
});

export const editNode = (node: Mutable<NodeEdit>) => ({
  type: 'edit/edit_node' as const,
  payload: node,
});

export const restoreNode = (nodeId: string) => ({
  type: 'edit/restore_node' as const,
  payload: nodeId,
});

export const createNode = (node: NewNode) => ({
  type: 'edit/create_node' as const,
  payload: node,
});

export const deleteField = (fieldId: string) => ({
  type: 'edit/delete_field' as const,
  payload: fieldId,
});

export const editField = (field: Mutable<FieldEdit>) => ({
  type: 'edit/edit_field' as const,
  payload: field,
});

export const restoreField = (fieldId: string) => ({
  type: 'edit/restore_field' as const,
  payload: fieldId,
});

export const createField = (field: NewField) => ({
  type: 'edit/create_field' as const,
  payload: field,
});

export const deleteArg = (argId: string) => ({
  type: 'edit/delete_arg' as const,
  payload: argId,
});

export const editArg = (arg: Mutable<ArgEdit>) => ({
  type: 'edit/edit_arg' as const,
  payload: arg,
});

export const restoreArg = (argId: string) => ({
  type: 'edit/restore_arg' as const,
  payload: argId,
});

export const createArg = (arg: NewArg) => ({
  type: 'edit/create_arg' as const,
  payload: arg,
});

export type EditAction =
  | ReturnType<typeof deleteNode>
  | ReturnType<typeof editNode>
  | ReturnType<typeof restoreNode>
  | ReturnType<typeof createNode>
  | ReturnType<typeof deleteField>
  | ReturnType<typeof editField>
  | ReturnType<typeof restoreField>
  | ReturnType<typeof createField>
  | ReturnType<typeof deleteArg>
  | ReturnType<typeof editArg>
  | ReturnType<typeof restoreArg>
  | ReturnType<typeof createArg>;
