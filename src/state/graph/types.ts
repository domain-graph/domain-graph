import {
  array,
  define,
  key,
  required,
  optional,
  indexOf,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

export type Edit<T extends { id: string }> = Pick<T, 'id'> & Partial<T>;

export type Node = {
  id: string;
  description?: string;
  fieldIds: string[];
  isDeleted: boolean;
};

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  fieldIds: required(array()),
  isDeleted: required(),
});

export type NodeEdit = {
  id: string;
  description?: string;
  fieldIds?: string[];
  isNew?: boolean;
  isDeleted?: boolean;
};

export const nodeEditDef = define<NodeEdit>({
  id: key(),
  description: optional(),
  fieldIds: optional(array()),
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
  edges: Record<string, Edge>;
  fields: Record<string, Field>;
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
  edges: required(indexOf(edgeDef)),
  fields: required(indexOf(fieldDef)),
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
  edges: {},
  fields: {},
  nodes: {},
  nodeEdits: {},
  visibleNodes: {},
  visibleEdgeIds: [],
};
