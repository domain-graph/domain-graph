import { MutableEdit } from '../types';
import { FieldEdit, NewField } from './types';

export const deleteField = (fieldId: string) => ({
  type: 'edit/delete_field' as const,
  payload: fieldId,
});

export const editField = (field: MutableEdit<FieldEdit>) => ({
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

export type FieldAction =
  | ReturnType<typeof deleteField>
  | ReturnType<typeof editField>
  | ReturnType<typeof restoreField>
  | ReturnType<typeof createField>;
