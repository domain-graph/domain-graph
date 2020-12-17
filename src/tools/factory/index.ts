import { Node, Edge, Argument } from '../../types';
import {
  Field,
  FieldType,
  InputValue,
  isEnumFieldType,
  isInterfaceType,
  isObjectType,
  isScalarFieldType,
  Schema,
  SchemaType,
} from '../types';
import { normalizeFieldType } from '../utils';
import { get } from './heuristics/utils';
import { TypeHeuristic } from './types';

function toArgument(valueOrField: InputValue | Field): Argument {
  const { type: specificType, ...rest } = normalizeFieldType(valueOrField.type);

  const { name, kind } = specificType;

  return {
    name: valueOrField.name,
    description: valueOrField.description,
    type: { name, kind },
    ...rest,
  };
}

function buildNode(
  type: SchemaType,
  schema: Schema,
  heuristics: TypeHeuristic[],
): { node: Node | null; edges: Edge[] } {
  const results = get(heuristics, schema);

  if (
    results.byIgnoredTypeName(type.name) ||
    (!isObjectType(type) && !isInterfaceType(type))
  ) {
    return { node: null, edges: [] };
  }

  const fields = type.fields.map((field) => {
    const normalizedType = normalizeFieldType(field.type);

    const heuristicResult = results.byIgnoredTypeName(normalizedType.type.name);

    const target = heuristicResult?.canonicalType || normalizedType.type;
    const isList = heuristicResult?.forceList || normalizedType.isList;

    const connectionArgs = new Set(['before', 'after', 'first', 'last']);
    const args: Argument[] = field.args
      .map(toArgument)
      .filter((arg) =>
        heuristicResult?.heuristicName === 'connection'
          ? !connectionArgs.has(arg.name)
          : true,
      );

    const edge: Edge = {
      id: `${type.name}>${field.name}>${target.name}`,
      name: field.name,
      description: field.description,
      optional: !normalizedType.isNotNull,
      source: type.name,
      target: target.name,
      plurality: isList ? 'array' : 'single',
      args,
    };

    if (heuristicResult) {
      edge.heuristic = heuristicResult.heuristicName;
    }

    return { field, normalizedType, edge };
  });

  const edges = fields
    .filter(
      (x) =>
        !isScalarFieldType(x.normalizedType.type) &&
        !isEnumFieldType(x.normalizedType.type),
    )
    .map((x) => x.edge);

  const node: Node = {
    id: type.name,
    description: type.description,
    fields: fields.map((f) => ({
      edgeId:
        isScalarFieldType(f.normalizedType.type) ||
        isEnumFieldType(f.normalizedType.type)
          ? null
          : f.edge.id,
      ...toArgument(f.field),
    })),
  };

  return { node, edges };
}

export class GraphFactory {
  constructor(...heuristics: TypeHeuristic[]) {
    this.heuristics = heuristics;
  }
  private readonly heuristics: TypeHeuristic[];

  build(schema: Schema): { nodes: Node[]; edges: Edge[] } {
    const nodeIndex: Record<string, Node> = {};
    const edgeIndex: Record<string, Edge> = {};

    for (const type of schema.data.__schema.types) {
      const { node, edges } = buildNode(type, schema, this.heuristics);

      if (node) {
        nodeIndex[node.id] = node;
      }

      for (const edge of edges) {
        edgeIndex[edge.id] = edge;
      }
    }

    return {
      nodes: Object.keys(nodeIndex).map((key) => nodeIndex[key]),
      edges: Object.keys(edgeIndex).map((key) => edgeIndex[key]),
    };
  }
}
