import { MutableEdit } from '../types';
import { ArgEdit, NewArg } from './types';

export const deleteArg = (argId: string) => ({
  type: 'edit/delete_arg' as const,
  payload: argId,
});

export const editArg = (arg: MutableEdit<ArgEdit>) => ({
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

export type ArgAction =
  | ReturnType<typeof deleteArg>
  | ReturnType<typeof editArg>
  | ReturnType<typeof restoreArg>
  | ReturnType<typeof createArg>;
