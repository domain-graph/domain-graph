import { NodeEdit, NewNode } from './types';
import { MutableEdit } from '../types';

export const deleteNode = (nodeId: string) => ({
  type: 'edit/delete_node' as const,
  payload: nodeId,
});

export const editNode = (node: MutableEdit<NodeEdit>) => ({
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

export type NodeAction =
  | ReturnType<typeof deleteNode>
  | ReturnType<typeof editNode>
  | ReturnType<typeof restoreNode>
  | ReturnType<typeof createNode>;
