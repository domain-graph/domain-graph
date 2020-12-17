import { Node, Edge } from '../../types';
import { Field, Schema, SchemaType } from '../types';

export interface TypeHeuristic {
  (type: SchemaType, schema: Schema): TypeHeuristicResult | null;
}

export interface TypeHeuristicResult {
  heuristicName: string;
  canonicalType: SchemaType | null;
  forceList: boolean;
  ignoredTypes: Iterable<SchemaType>;
}

export interface NodeStrategy {
  (type: SchemaType, schema: Schema, heuristics: TypeHeuristic[]): Node | null;
}

export interface FieldStrategy {
  (
    field: Field,
    parent: SchemaType,
    schema: Schema,
    heuristics: TypeHeuristic[],
  ): Edge | null;
}
