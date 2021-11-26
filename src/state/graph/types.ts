import {
  array,
  define,
  key,
  required,
  optional,
  indexOf,
} from 'flux-standard-functions';
import { Arg, argDef, ArgEdit, argEditDef } from './args/types';
import { Enum, enumDef } from './enums/types';
import { EnumValue, enumValueDef } from './enum-values/types';
import { Field, fieldDef, FieldEdit, fieldEditDef } from './fields/types';
import { Node, nodeDef, NodeEdit, nodeEditDef } from './nodes/types';
import { Input, inputDef } from './inputs/types';
import { InputField, inputFieldDef } from './input-fields/types';

export type Entity = { id: string };
export type Edit = Entity & { isNew?: boolean; isDeleted?: boolean };
export type MutableEntity<T extends Entity> = Pick<T, 'id'> &
  Partial<Omit<T, keyof Entity>>;
export type MutableEdit<T extends Edit> = Pick<T, 'id'> &
  Partial<Omit<T, keyof Edit>>;

export type Edge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  fieldIds: string[];
  hideWith?: string[];
  showWith?: string[];
};

export const edgeDef = define<Edge>({
  id: key(),
  sourceNodeId: required(),
  targetNodeId: required(),
  fieldIds: required(array()),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type EdgeEdit = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  createdFieldIds?: string[];
  deletedFieldIds?: string[];
  isNew?: boolean;
  isDeleted?: boolean;
};

export const edgeEditDef = define<EdgeEdit>({
  id: key(),
  sourceNodeId: required(),
  targetNodeId: required(),
  createdFieldIds: optional(array()),
  deletedFieldIds: optional(array()),
  isNew: optional(),
  isDeleted: optional(),
});

export type VisibleNode = {
  id: string;
  isPinned: boolean;
  x?: number;
  y?: number;
};

export const visibleNodeDef = define<VisibleNode>({
  id: key(),
  isPinned: required(),
  x: optional(),
  y: optional(),
});

export type GraphState = {
  args: Record<string, Arg>;
  argEdits: Record<string, ArgEdit>;
  edges: Record<string, Edge>;
  edgeEdits: Record<string, EdgeEdit>;
  fields: Record<string, Field>;
  fieldEdits: Record<string, FieldEdit>;
  nodes: Record<string, Node>;
  nodeEdits: Record<string, NodeEdit>;
  enums: Record<string, Enum>;
  enumValues: Record<string, EnumValue>;
  inputs: Record<string, Input>;
  inputFields: Record<string, InputField>;
  visibleNodes: Record<string, VisibleNode>;
  visibleEdgeIds: string[];
  selectedSourceNodeId?: string;
  selectedFieldId?: string;
  selectedTargetNodeId?: string;
};

export const stateDef = define<GraphState>({
  args: required(indexOf(argDef)),
  argEdits: required(indexOf(argEditDef)),
  edges: required(indexOf(edgeDef)),
  edgeEdits: required(indexOf(edgeEditDef)),
  fields: required(indexOf(fieldDef)),
  fieldEdits: required(indexOf(fieldEditDef)),
  nodes: required(indexOf(nodeDef)),
  nodeEdits: required(indexOf(nodeEditDef)),
  enums: required(indexOf(enumDef)),
  enumValues: required(indexOf(enumValueDef)),
  inputs: required(indexOf(inputDef)),
  inputFields: required(indexOf(inputFieldDef)),
  visibleNodes: required(indexOf(visibleNodeDef)),
  visibleEdgeIds: required(array()),
  selectedSourceNodeId: optional(),
  selectedFieldId: optional(),
  selectedTargetNodeId: optional(),
});

export const defaultState: GraphState = {
  args: {},
  argEdits: {},
  edges: {},
  edgeEdits: {},
  fields: {},
  fieldEdits: {},
  nodes: {},
  nodeEdits: {},
  enums: {},
  enumValues: {},
  inputs: {},
  inputFields: {},
  visibleNodes: {},
  visibleEdgeIds: [],
};
