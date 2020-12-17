import { getField, getType } from '../../utils';
import { TypeHeuristic } from '../types';

export const connectionHeuristic: TypeHeuristic = (type, schema) => {
  const baseName = getBaseName(type.name);

  const connection = getType(`${baseName}Connection`, schema);
  const edge = getType(`${baseName}Edge`, schema);
  const pageInfo = getType('PageInfo', schema);
  const baseType = getType(baseName, schema);

  if (!connection || !edge || !pageInfo || !baseType) return null;

  const connectionPageInfo = getField(connection.name, 'pageInfo', schema);
  const connectionNodes = getField(connection.name, 'nodes', schema);
  const connectionEdges = getField(connection.name, 'edges', schema);
  const edgeNode = getField(edge.name, 'node', schema);

  if (
    !connectionPageInfo ||
    !connectionNodes ||
    !connectionEdges ||
    !edgeNode
  ) {
    return null;
  }

  if (
    edgeNode.type.name === baseName &&
    !edgeNode.isList &&
    connectionNodes.type.name === baseName &&
    connectionNodes.isList &&
    connectionEdges.type.name === edge.name &&
    connectionEdges.isList
  ) {
    return {
      heuristicName: 'connection',
      canonicalType: baseType,
      forceList: true,
      ignoredTypes: [connection, edge, pageInfo],
    };
  }

  return null;
};

function getBaseName(name: string): string {
  const suffixes = ['Edge', 'Connection'];

  for (const suffix of suffixes) {
    if (name.endsWith(suffix))
      return name.substr(0, name.length - suffix.length);
  }

  return name;
}
