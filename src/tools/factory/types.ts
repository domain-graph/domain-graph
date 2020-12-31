import { Schema, SchemaType } from '../types';

export interface TypeHeuristic {
  (type: SchemaType, schema: Schema): TypeHeuristicResult | null;
}

export interface TypeHeuristicResult {
  heuristicName: string;
  canonicalType: SchemaType | null;
  forceList: boolean;
  ignoredTypes: Iterable<SchemaType>;
}
