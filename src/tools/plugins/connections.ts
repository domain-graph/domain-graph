import { Edge, Field } from '../../state/graph';
import { buildEdgeId } from '../factory';
import { StateFactoryPlugin } from '../types';

export const pluginName = 'simple-connections';

export const connections: StateFactoryPlugin = (state) => {
  for (const nodeId in state.nodes) {
    if (nodeId.endsWith('Connection')) {
      const name = nodeId.substr(0, nodeId.length - 'Connection'.length);

      const connectionNode = state.nodes[`${name}Connection`];
      const pageInfoNode = state.nodes['PageInfo'];

      if (!connectionNode || !pageInfoNode) continue;

      const connectionFields = connectionNode.fieldIds
        .map((fieldId) => state.fields[fieldId])
        .filter((x) => x);

      const connectionEdgesField = connectionFields.find(
        (f) => f.name === 'edges' && f.typeKind !== 'SCALAR',
      );
      if (!connectionEdgesField) continue;

      const edgeNode = state.nodes[connectionEdgesField.typeName];
      if (!edgeNode) continue;

      const connectionNodesField = connectionFields.find(
        (f) =>
          f.name === 'nodes' && f.typeKind !== 'SCALAR' && f.isList === true,
      );
      if (!connectionNodesField) continue;

      const connectionPageInfoField = connectionFields.find(
        (f) =>
          f.name === 'pageInfo' &&
          f.typeName === pageInfoNode.id &&
          f.isList === false,
      );
      if (!connectionPageInfoField) continue;

      const targetNode = state.nodes[connectionNodesField.typeName];
      if (!targetNode) continue;

      const virtualSourceIds = new Set<string>();

      hide(connectionNode);
      for (const edgeId of connectionNode.edgeIds) {
        const edge = state.edges[edgeId];
        hide(edge);
        for (const fieldId of edge.fieldIds) {
          hide(state.fields[fieldId]);
        }

        virtualSourceIds.add(edge.sourceNodeId);
        virtualSourceIds.add(edge.targetNodeId);
      }
      for (const fieldId of connectionNode.fieldIds) {
        hide(state.fields[fieldId]);
      }

      hide(edgeNode);
      for (const edgeId of edgeNode.edgeIds) {
        hide(state.edges[edgeId]);
        for (const fieldId of state.edges[edgeId].fieldIds) {
          hide(state.fields[fieldId]);
        }
      }
      for (const fieldId of edgeNode.fieldIds) {
        hide(state.fields[fieldId]);
      }

      hide(pageInfoNode);

      virtualSourceIds.delete(connectionNode.id);
      virtualSourceIds.delete(edgeNode.id);
      virtualSourceIds.delete(pageInfoNode.id);

      for (const sourceId of virtualSourceIds) {
        const sourceNode = state.nodes[sourceId];

        // TODO: don't match nodes using typeName
        const fieldsToRewrite = sourceNode.fieldIds
          .map((fieldId) => state.fields[fieldId])
          .filter((field) => field?.typeName === connectionNode.id);

        for (const fieldToRewrite of fieldsToRewrite) {
          if (!fieldToRewrite) continue;

          const newFieldId = `${fieldToRewrite.id}~${pluginName}`;
          const {
            edgeId,
            isReverse,
            sourceId: edgeSourceId,
            targetId: edgeTargetId,
          } = buildEdgeId(sourceId, targetNode.id);

          const isNewEdge = !state.edges[edgeId];

          const edge: Edge = state.edges[edgeId] || {
            id: edgeId,
            fieldIds: [],
            sourceNodeId: edgeSourceId,
            targetNodeId: edgeTargetId,
          };
          edge.fieldIds.push(newFieldId);

          if (isNewEdge) {
            show(edge);
          } else {
            edge.hideWith = remove(edge.hideWith, pluginName);
            edge.showWith = remove(edge.showWith, pluginName);
          }

          const newArgs = fieldToRewrite.argIds
            .map((argId) => ({
              ...state.args[argId],
              id: `${argId}~${pluginName}`,
              fieldId: newFieldId,
              hideWith: undefined,
              showWith: [pluginName],
            }))
            .filter((arg) => !pagingArgs.has(arg.name));

          const newField: Field = {
            ...connectionNodesField,
            isNotNull: fieldToRewrite.isNotNull,
            id: newFieldId,
            edgeId,
            name: fieldToRewrite.name,
            description: fieldToRewrite.description,
            argIds: newArgs.map((arg) => arg.id),
            nodeId: sourceId,
            isReverse,
            hideWith: undefined,
            showWith: [pluginName],
          };

          sourceNode.fieldIds.push(newFieldId);
          if (isNewEdge) sourceNode.edgeIds.push(edgeId);

          state.fields[newField.id] = newField;
          state.edges[edge.id] = edge;
          for (const arg of newArgs) {
            state.args[arg.id] = arg;
          }
        }
      }
    }
  }

  return state;
};

const pagingArgs = new Set(['first', 'after', 'last', 'before']);

function show<T extends { hideWith?: string[]; showWith?: string[] }>(
  item: T,
): T {
  item.hideWith = remove(item.hideWith, pluginName);
  item.showWith = add(item.showWith, pluginName);
  return item;
}

function hide<T extends { hideWith?: string[]; showWith?: string[] }>(
  item: T,
): T {
  item.hideWith = add(item.hideWith, pluginName);
  item.showWith = remove(item.showWith, pluginName);
  return item;
}

function remove(
  values: string[] | undefined,
  value: string,
): string[] | undefined {
  if (!values?.length) return undefined;

  if (!values.includes(value)) return values;

  if (values.length === 1) return undefined;

  return values.filter((v) => v !== value);
}

function add(values: string[] | undefined, value: string): string[] {
  if (!values) return [value];

  if (values.includes(value)) return values;

  return [...values, value];
}
