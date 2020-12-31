import { IntrospectionQuery } from 'graphql';
import { Edge } from '../../state/edges';
import { Field } from '../../state/fields';
import { Node } from '../../state/nodes';
import {
  isEnumFieldType,
  isScalarFieldType,
  isTypeWithFields,
  Schema,
  SchemaType,
  Field as SchemaField,
  SpecificFieldType,
} from '../types';
import { normalizeFieldType } from '../utils';
import { TypeHeuristic, TypeHeuristicResult } from './types';

function createNodeId(type: SchemaType | SpecificFieldType): string {
  return type.name;
}

function createEdgeId(
  source: SchemaType | SpecificFieldType,
  target: SchemaType | SpecificFieldType,
): string {
  return `${source.name}>${target.name}`;
}

function createFieldId(type: SpecificFieldType, field: SchemaField): string {
  return `${type.name}.${field.name}`;
}

export function getInitialState(
  introspection: IntrospectionQuery,
  heuristics: TypeHeuristic[],
): { nodes: Node[]; edges: Edge[]; fields: Field[] } {
  const schema: Schema = { data: introspection as any };
  const { types } = schema.data.__schema;

  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const fields = new Map<string, Field>();

  const edgeIdsByFieldId = new Map<string, string>();

  // Run heuristics against all types
  const resultsByCanonicalType = new Map<string, TypeHeuristicResult>();
  const resultsByIgnoredType = new Map<string, TypeHeuristicResult>();
  for (const type of types) {
    for (const heuristic of heuristics) {
      const result = heuristic(type, schema);

      if (result?.canonicalType?.name) {
        resultsByCanonicalType.set(result.canonicalType.name, result);
      }
      if (result?.ignoredTypes) {
        for (const ignoredType of result.ignoredTypes) {
          resultsByIgnoredType.set(ignoredType.name, result);
        }
      }
    }
  }

  const filteredTypes = types
    .filter((t) => !resultsByIgnoredType.has(t.name))
    .filter(isTypeWithFields); // TODO: support union types

  // Build initial state
  for (const type of filteredTypes) {
    // Build Nodes
    const node: Node = {
      id: createNodeId(type),
      description: type.description || undefined,
      isPinned: false,
      isVisible: false,
    };
    nodes.set(node.id, node);
  }

  // Build Edges
  for (const type of filteredTypes) {
    const nodeId = createNodeId(type);
    if (!nodes.has(nodeId)) continue;
    for (const field of type.fields) {
      const fieldType = normalizeFieldType(field.type);
      if (isScalarFieldType(fieldType.type)) continue;
      if (isEnumFieldType(fieldType.type)) continue;

      const targetType = resultsByIgnoredType.has(fieldType.type.name)
        ? resultsByIgnoredType.get(fieldType.type.name)?.canonicalType
        : fieldType.type;

      if (!targetType) continue;
      if (!nodes.has(targetType?.name)) continue;

      const forwardId = createEdgeId(type, targetType);
      const reverseId = createEdgeId(targetType, type);

      const edgeId = edges.has(reverseId) ? reverseId : forwardId;
      const fieldId = createFieldId(type, field);

      edges.set(edgeId, {
        id: edgeId,
        sourceNodeId: nodeId,
        targetNodeId: createNodeId(targetType),
      });
      edgeIdsByFieldId.set(fieldId, edgeId);
    }
  }

  // Build Fields
  for (const type of filteredTypes) {
    const nodeId = createNodeId(type);
    if (!nodes.has(nodeId)) continue;
    for (const field of type.fields) {
      const fieldType = normalizeFieldType(field.type);

      const hueristicResult = resultsByIgnoredType.get(fieldType.type.name);

      const targetType = hueristicResult
        ? hueristicResult.canonicalType
        : fieldType.type;

      if (!targetType) continue;
      if (targetType.kind === 'INPUT_OBJECT') continue;

      const fieldId = createFieldId(type, field);
      const edgeId = edgeIdsByFieldId.get(fieldId);
      const reverseEdgeId = createEdgeId(targetType, type);

      fields.set(fieldId, {
        id: fieldId,
        nodeId,
        edgeId,
        isReverse: edgeId === undefined ? undefined : edgeId === reverseEdgeId,
        name: field.name,
        description: field.description || undefined,
        heuristic: hueristicResult?.heuristicName,
        typeKind: targetType.kind,
        typeName: targetType.name,
        isNotNull: fieldType.isNotNull,
        isList: hueristicResult ? hueristicResult.forceList : fieldType.isList,
        isListElementNotNull: fieldType.isListElementNotNull || undefined,
      });

      if (type.name === 'Repository') {
        console.log(fields.get(fieldId));
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    fields: Array.from(fields.values()),
  };
}
