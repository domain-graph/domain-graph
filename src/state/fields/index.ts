import {
  define,
  key,
  required,
  optional,
  indexOf,
  Index,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

import { Entity } from '../entity';

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

export type FieldsState = {
  data: Index<Field>;
};

const stateDef = define<FieldsState>({
  data: required(indexOf(fieldDef)),
});

export const fields = new Entity('FIELDS', stateDef, fieldDef, { data: {} });
