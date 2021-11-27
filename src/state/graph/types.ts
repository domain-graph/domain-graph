import {
  array,
  define,
  key,
  required,
  optional,
  indexOf,
} from 'flux-standard-functions';
import { SpecificFieldType, SpecificInputFieldType } from '../../tools/types';

export type Entity = { id: string };

export type Arg = {
  id: string;
  fieldId: string;
  name: string;
  description?: string;
  defaultValue?: string;
  typeKind: SpecificInputFieldType['kind'];
  typeName: SpecificInputFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
  hideWith?: string[];
  showWith?: string[];
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
  hideWith: optional(array()),
  showWith: optional(array()),
});

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

export type Enum = {
  id: string;
  description?: string;
  valueIds: string[];
  hideWith?: string[];
  showWith?: string[];
};

export const enumDef = define<Enum>({
  id: key(),
  description: optional(),
  valueIds: required(array()),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type EnumValue = {
  id: string;
  enumId: string;
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
  hideWith?: string[];
  showWith?: string[];
};

export const enumValueDef = define<EnumValue>({
  id: key(),
  enumId: required(),
  name: required(),
  description: optional(),
  isDeprecated: required(),
  deprecationReason: optional(),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type Field = {
  id: string;
  nodeId: string;
  edgeId?: string;
  argIds: string[];
  isReverse?: boolean;
  name: string;
  description?: string;
  typeKind: SpecificFieldType['kind'];
  typeName: SpecificFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
  hideWith?: string[];
  showWith?: string[];
};

export const fieldDef = define<Field>({
  id: key(),
  nodeId: required(),
  edgeId: optional(),
  argIds: required(array()),
  isReverse: optional(),
  name: required(),
  description: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type InputField = {
  id: string;
  inputId: string;
  name: string;
  description?: string;
  defaultValue?: string;
  typeKind: SpecificInputFieldType['kind'];
  typeName: SpecificInputFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
  hideWith?: string[];
  showWith?: string[];
};

export const inputFieldDef = define<InputField>({
  id: key(),
  inputId: required(),
  name: required(),
  description: optional(),
  defaultValue: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type Input = {
  id: string;
  description?: string;
  inputFieldIds: string[];
  hideWith?: string[];
  showWith?: string[];
};

export const inputDef = define<Input>({
  id: key(),
  description: optional(),
  inputFieldIds: required(array()),
  hideWith: optional(array()),
  showWith: optional(array()),
});

export type Node = {
  id: string;
  description?: string;
  edgeIds: string[];
  fieldIds: string[];
  hideWith?: string[];
  showWith?: string[];
};

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  edgeIds: required(array()),
  fieldIds: required(array()),
  hideWith: optional(array()),
  showWith: optional(array()),
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
  enums: Record<string, Enum>;
  enumValues: Record<string, EnumValue>;
  inputs: Record<string, Input>;
  inputFields: Record<string, InputField>;
  visibleNodes: Record<string, VisibleNode>;
  visibleEdgeIds: string[];
  selectedSourceNodeId?: string;
  selectedFieldId?: string;
  selectedTargetNodeId?: string;
  plugins: string[];
  activePlugins: string[];
};

export const stateDef = define<GraphState>({
  args: required(indexOf(argDef)),
  edges: required(indexOf(edgeDef)),
  fields: required(indexOf(fieldDef)),
  nodes: required(indexOf(nodeDef)),
  enums: required(indexOf(enumDef)),
  enumValues: required(indexOf(enumValueDef)),
  inputs: required(indexOf(inputDef)),
  inputFields: required(indexOf(inputFieldDef)),
  visibleNodes: required(indexOf(visibleNodeDef)),
  visibleEdgeIds: required(array()),
  selectedSourceNodeId: optional(),
  selectedFieldId: optional(),
  selectedTargetNodeId: optional(),
  plugins: required(array()),
  activePlugins: required(array()),
});

export const defaultState: GraphState = {
  args: {},
  edges: {},
  fields: {},
  nodes: {},
  enums: {},
  enumValues: {},
  inputs: {},
  inputFields: {},
  visibleNodes: {},
  visibleEdgeIds: [],
  plugins: [],
  activePlugins: [],
};
