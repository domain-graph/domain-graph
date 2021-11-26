import { Schema, SchemaType } from '../types';

import { DocumentNode } from 'graphql';
import { GraphState } from '../../state/graph';
import { SaveState } from '../..';

export interface TypeHeuristic {
  (type: SchemaType, schema: Schema): TypeHeuristicResult | null;
}

export interface TypeHeuristicResult {
  heuristicName: string;
  canonicalType: SchemaType | null;
  forceList: boolean;
  ignoredTypes: Iterable<SchemaType>;
}

export type V3GraphState = Pick<
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
  (
    document: DocumentNode,
    heuristic: any[],
    initialSaveState?: SaveState,
  ): GraphState;
}

export interface Simplifier {
  (state: GraphState): GraphState;
}

export interface V3StateFactory {
  (document: DocumentNode, plugins?: V3StatePlugin[]): V3GraphState;
}

export interface V3StatePlugin {
  (state: V3GraphState): V3GraphState;
}
