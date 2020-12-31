import {
  define,
  key,
  required,
  optional,
  indexOf,
  array,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

import { Entity, StandardReducer } from '../entity';
import { buildIndexSideEffect, handleSelectFields } from './side-effects';

export type Field = {
  id: string;
  nodeId: string;
  edgeId?: string;
  isReverse?: boolean;
  name: string;
  description?: string;
  heuristic?: string;
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
  heuristic: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
});

export type ByNodeId = {
  nodeId: string;
  fieldIds: string[];
};

export const byNodeIdDef = define<ByNodeId>({
  nodeId: key(),
  fieldIds: required(),
});

export type FieldsState = {
  ix_nodeId: Record<string, ByNodeId>;
  data: Record<string, Field>;
  selectedFieldId?: string;
};

export const stateDef = define<FieldsState>({
  ix_nodeId: required(array()),
  data: required(indexOf(fieldDef)),
  selectedFieldId: optional(),
});

export const fields = new Entity('FIELDS', stateDef, fieldDef, {
  ix_nodeId: {},
  data: {},
});

export const reducer: StandardReducer<'FIELDS', Field, FieldsState> = (
  originalState,
  action,
) => {
  let currentState = fields.standardReducer(originalState, action);
  currentState = buildIndexSideEffect(originalState, currentState, action);
  currentState = handleSelectFields(originalState, currentState, action);

  return currentState;
};
