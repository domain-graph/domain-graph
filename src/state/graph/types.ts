import {
  array,
  define,
  key,
  required,
  optional,
  indexOf,
  DELETE_VALUE,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

export type Edit = { id: string; isNew?: boolean; isDeleted?: boolean };
export type Mutable<T extends Edit> = Pick<T, 'id'> &
  Partial<Omit<T, keyof Edit>>;

export type Node = {
  id: string;
  description?: string;
  fieldIds: string[];
};

export type NewNode = Omit<Node, 'fieldIds'>;

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  fieldIds: required(array()),
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

export type Edge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  fieldIds: string[];
};

export const edgeDef = define<Edge>({
  id: key(),
  sourceNodeId: required(),
  targetNodeId: required(),
  fieldIds: required(array()),
});

export type EdgeEdit = {
  id: string;
  fieldIds?: string[];
  isNew?: boolean;
  isDeleted?: boolean;
};

export const edgeEditDef = define<EdgeEdit>({
  id: key(),
  fieldIds: optional(array()),
  isNew: optional(),
  isDeleted: optional(),
});

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
});

export type FieldEdit = Edit & {
  nodeId: string;
  edgeId?: string;
  argIds?: string[];
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
  argIds: optional(array()),
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

export type ArgEdit = {
  id: string;
  fieldId: string;
  name?: string;
  description?: string | null;
  defaultValue?: string | null;
  typeKind?: SpecificFieldType['kind'];
  typeName?: SpecificFieldType['name'];
  isNotNull?: boolean;
  isList?: boolean;
  isListElementNotNull?: boolean | null;
};

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
  visibleNodes: {},
  visibleEdgeIds: [],
};
