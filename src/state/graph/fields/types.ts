import {
  array,
  define,
  key,
  required,
  optional,
  DELETE_VALUE,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../../tools/types';
import { Edit } from '../types';

export type Field = {
  id: string;
  nodeId: string;
  edgeId?: string;
  argIds: string[];
  isReverse?: boolean;
  name: string;
  description?: string;
  heuristic?: string;
  typeKind: SpecificFieldType['kind'];
  typeName: SpecificFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
  hideWith?: string[];
  showWith?: string[];
};

export type NewField = Omit<
  Field,
  'edgeId' | 'argIds' | 'isReverse' | 'heuristic'
>;

export const fieldDef = define<Field>({
  id: key(),
  nodeId: required(),
  edgeId: optional(),
  argIds: required(array()),
  isReverse: optional(),
  name: required(),
  description: optional(),
  heuristic: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type FieldEdit = Edit & {
  nodeId: string;
  edgeId?: string;
  createdArgIds?: string[];
  deletedArgIds?: string[];
  isReverse?: boolean | typeof DELETE_VALUE;
  name?: string;
  description?: string | typeof DELETE_VALUE;
  typeKind?: SpecificFieldType['kind'];
  typeName?: SpecificFieldType['name'];
  isNotNull?: boolean;
  isList?: boolean;
  isListElementNotNull?: boolean | typeof DELETE_VALUE;
};

export const fieldEditDef = define<FieldEdit>({
  id: key(),
  nodeId: required(),
  edgeId: optional(),
  createdArgIds: optional(array()),
  deletedArgIds: optional(array()),
  isReverse: optional(),
  name: optional(),
  description: optional(),
  typeKind: optional(),
  typeName: optional(),
  isNotNull: optional(),
  isList: optional(),
  isListElementNotNull: optional(),
  isNew: optional(),
  isDeleted: optional(),
});
