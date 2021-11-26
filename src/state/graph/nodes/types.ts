import {
  array,
  define,
  key,
  required,
  optional,
  DELETE_VALUE,
} from 'flux-standard-functions';

import { Edit } from '../types';

export type Node = {
  id: string;
  description?: string;
  edgeIds: string[];
  fieldIds: string[];
  hideWith?: string[];
  showWith?: string[];
};

export type NewNode = Omit<Node, 'fieldIds'>;

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  edgeIds: required(array()),
  fieldIds: required(array()),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type NodeEdit = Edit & {
  description?: string | typeof DELETE_VALUE;
  createdFieldIds?: string[];
  deletedFieldIds?: string[];
};

export const nodeEditDef = define<NodeEdit>({
  id: key(),
  description: optional(),
  createdFieldIds: optional(array()),
  deletedFieldIds: optional(array()),
  isNew: optional(),
  isDeleted: optional(),
});
