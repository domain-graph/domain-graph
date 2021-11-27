import { DocumentNode } from 'graphql';
import { GraphState } from '../state/graph';

export type FactoryGraphState = Pick<
  GraphState,
  | 'nodes'
  | 'edges'
  | 'args'
  | 'enums'
  | 'enumValues'
  | 'fields'
  | 'inputs'
  | 'inputFields'
>;

export interface StateFactory {
  (document: DocumentNode, plugins?: StateFactoryPlugin[]): FactoryGraphState;
}

export interface StateFactoryPlugin {
  (state: FactoryGraphState): FactoryGraphState;
}

// TODO: replace usage of the following types with native graphql types instead
export type SpecificFieldType =
  | ObjectFieldType
  | ScalarFieldType
  | EnumFieldType
  | UnionFieldType
  | InterfaceFieldType;

export type SpecificInputFieldType =
  | ScalarFieldType
  | EnumFieldType
  | InputObjectFieldType;

export interface ObjectFieldType {
  kind: 'OBJECT';
  name: string;
}

export interface InputObjectFieldType {
  kind: 'INPUT_OBJECT';
  name: string;
}

export interface ScalarFieldType {
  kind: 'SCALAR';
  name: string;
}

export interface EnumFieldType {
  kind: 'ENUM';
  name: string;
}

export interface UnionFieldType {
  kind: 'UNION';
  name: string;
}

export interface InterfaceFieldType {
  kind: 'INTERFACE';
  name: string;
}
