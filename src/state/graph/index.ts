import {
  array,
  define,
  key,
  required,
  optional,
  indexOf,
} from 'flux-standard-functions';
import { SpecificFieldType } from '../../tools/types';

export type Node = {
  id: string;
  description?: string;
  fieldIds: string[];
};

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  fieldIds: required(array()),
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

export type VisibleNode = {
  id: string;
  isPinned: boolean;
};

export const visibleNodeDef = define<VisibleNode>({
  id: key(),
  isPinned: required(),
});

export type GraphState = {
  edges: Record<string, Edge>;
  fields: Record<string, Field>;
  nodes: Record<string, Node>;
  visibleNodes: Record<string, VisibleNode>;
  visibleEdgeIds: string[];
  selectedSourceNodeId?: string;
  selectedFieldId?: string;
  selectedTargetNodeId?: string;
};

export const stateDef = define<GraphState>({
  edges: required(indexOf(edgeDef)),
  fields: required(indexOf(fieldDef)),
  nodes: required(indexOf(nodeDef)),
  visibleNodes: required(indexOf(visibleNodeDef)),
  visibleEdgeIds: required(array()),
  selectedSourceNodeId: optional(),
  selectedFieldId: optional(),
  selectedTargetNodeId: optional(),
});

export const defaultState: GraphState = {
  edges: {},
  fields: {},
  nodes: {},
  visibleNodes: {},
  visibleEdgeIds: [],
};
