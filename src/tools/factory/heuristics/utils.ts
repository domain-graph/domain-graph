import { Schema, SchemaType } from '../../types';
import { TypeHeuristic, TypeHeuristicResult } from '../types';

export function get(heuristics: TypeHeuristic[], schema: Schema) {
  const cache: TypeHeuristicResultCache = cacheBySchema.get(schema) || {
    byIgnoredTypeName: new Map(),
    byCanonicalTypeName: new Map(),
  };

  if (!cacheBySchema.has(schema)) {
    cacheBySchema.set(schema, cache);

    const { byCanonicalTypeName, byIgnoredTypeName } = cache;

    for (const type of schema.data.__schema.types) {
      for (const heuristic of heuristics) {
        const result = heuristic(type, schema);
        if (result) {
          for (const ignoredType of result.ignoredTypes) {
            byIgnoredTypeName.set(ignoredType.name, result);
          }

          if (result.canonicalType) {
            byCanonicalTypeName.set(result.canonicalType.name, result);
          }
        }
      }
    }
  }

  return {
    byIgnoredTypeName: (typeName: string) =>
      cache.byIgnoredTypeName.get(typeName),
    byCanonicalTypeName: (typeName: string) =>
      cache.byCanonicalTypeName.get(typeName),
  };
}

export interface TypeHeuristicResultCache {
  byIgnoredTypeName: Map<string, TypeHeuristicResult>;
  byCanonicalTypeName: Map<string, TypeHeuristicResult>;
}

const cacheBySchema = new WeakMap<Schema, TypeHeuristicResultCache>();
