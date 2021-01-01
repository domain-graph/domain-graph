import { IntrospectionQuery } from 'graphql';
import { Edge, Node, Field, Arg } from '../../state/graph';
import {
  isEnumFieldType,
  isScalarFieldType,
  isTypeWithFields,
  Schema,
  SchemaType,
  Field as SchemaField,
  SpecificFieldType,
  InputValue,
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

function createArgId(
  type: SpecificFieldType,
  field: SchemaField,
  arg: InputValue,
): string {
  return `${type.name}.${field.name}(${arg.name})`;
}

export function getInitialState(
  introspection: IntrospectionQuery,
  heuristics: TypeHeuristic[],
): { nodes: Node[]; edges: Edge[]; fields: Field[]; args: Arg[] } {
  const schema: Schema = { data: introspection as any };
  const { types } = schema.data.__schema;

  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const fields = new Map<string, Field>();
  const args = new Map<string, Arg>();

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
      fieldIds: [], // This gets populated in the reducer
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
      const sourceNodeId = edges.has(reverseId)
        ? createNodeId(targetType)
        : nodeId;
      const targetNodeId = edges.has(reverseId)
        ? nodeId
        : createNodeId(targetType);
      const fieldId = createFieldId(type, field);

      edges.set(edgeId, {
        id: edgeId,
        sourceNodeId,
        targetNodeId,
        fieldIds: [], // This gets populated in the reducer
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
        argIds: [], // This gets populated in the reducer
        isReverse: edgeId === undefined ? undefined : edgeId === reverseEdgeId,
        name: field.name,
        description: field.description || undefined,
        heuristic: hueristicResult?.heuristicName,
        typeKind: targetType.kind,
        typeName: targetType.name,
        isNotNull: fieldType.isNotNull,
        isList: hueristicResult ? hueristicResult.forceList : fieldType.isList,
        isListElementNotNull:
          fieldType.isListElementNotNull === null
            ? undefined
            : fieldType.isListElementNotNull,
      });

      // Build Args
      for (const arg of field.args) {
        const argType = normalizeFieldType(arg.type);

        const argId = createArgId(type, field, arg);

        // TODO: put this logic in the heuristic (issue: #47)
        if (hueristicResult?.heuristicName === 'connection') {
          if (arg.name === 'before') continue;
          if (arg.name === 'after') continue;
          if (arg.name === 'first') continue;
          if (arg.name === 'last') continue;
        }

        args.set(argId, {
          id: argId,
          fieldId,
          name: arg.name,
          description: arg.description || undefined,
          defaultValue: arg.defaultValue || undefined,
          typeKind: argType.type.kind,
          typeName: argType.type.name,
          isNotNull: argType.isNotNull,
          isList: argType.isList,
          isListElementNotNull:
            argType.isListElementNotNull === null
              ? undefined
              : argType.isListElementNotNull,
        });
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    fields: Array.from(fields.values()),
    args: Array.from(args.values()),
  };
}
