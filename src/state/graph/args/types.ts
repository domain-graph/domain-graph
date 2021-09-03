import {
  define,
  key,
  required,
  optional,
  DELETE_VALUE,
} from 'flux-standard-functions';

import { SpecificFieldType } from '../../../tools/types';
import { Edit } from '../types';

export type Arg = {
  id: string;
  fieldId: string;
  name: string;
  description?: string;
  defaultValue?: string;
  typeKind: SpecificFieldType['kind'];
  typeName: SpecificFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
};

export const argDef = define<Arg>({
  id: key(),
  fieldId: required(),
  name: required(),
  description: optional(),
  defaultValue: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
});

export type ArgEdit = Edit & {
  fieldId: string;
  name?: string;
  description?: string | typeof DELETE_VALUE;
  defaultValue?: string | typeof DELETE_VALUE;
  typeKind?: SpecificFieldType['kind'];
  typeName?: SpecificFieldType['name'];
  isNotNull?: boolean;
  isList?: boolean;
  isListElementNotNull?: boolean | typeof DELETE_VALUE;
};

export type NewArg = Arg;

export const argEditDef = define<ArgEdit>({
  id: key(),
  fieldId: required(),
  name: optional(),
  description: optional(),
  defaultValue: optional(),
  typeKind: optional(),
  typeName: optional(),
  isNotNull: optional(),
  isList: optional(),
  isListElementNotNull: optional(),
  isNew: optional(),
  isDeleted: optional(),
});