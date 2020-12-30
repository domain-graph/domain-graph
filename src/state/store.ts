import { IntrospectionQuery } from 'graphql';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';
import { index } from 'flux-standard-functions';

import { ApplicationState, reducers } from '.';
import { StateRepository } from '../graph-state/types';
import { getRegistry } from '../registry';
import { GraphFactory } from '../tools/factory';
import { interospectionHeuristic } from '../tools/factory/heuristics/introspection';
import { connectionHeuristic } from '../tools/factory/heuristics/relay-connection';

import { Node, nodeDef, nodes } from './nodes';
import { Edge, edgeDef, edges } from './edges';
import { Field, fieldDef, fields } from './fields';

const composeEnhancers =
  window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;
const registry = getRegistry();

export type ApplicationStore = Store<ReturnType<typeof reducers>>;

export async function getStore(
  graphId: string,
  introspection: IntrospectionQuery,
  stateRepository: StateRepository,
): Promise<ApplicationStore> {
  const state: ApplicationState = {
    fields: { ix_nodeId: {}, data: {} },
    edges: { data: {} },
    nodes: { data: {}, visibleNodeIds: [] },
  };

  const store = createStore(
    reducers,
    state,
    composeEnhancers(applyMiddleware(thunk.withExtraArgument(registry))),
  );

  // Build raw nodes and edges from introspection
  const data = new GraphFactory(
    connectionHeuristic,
    interospectionHeuristic,
  ).build(introspection);

  // Introspection Nodes
  store.dispatch(
    nodes.setEach(
      index(
        data.nodes.map<Node>((n) => ({
          id: n.id,
          isPinned: n.fixed,
          isVisible: !n.isHidden,
          description: n.description || undefined,
        })),
        nodeDef,
      ),
    ),
  );

  // Introspection Edges
  const edgeMap = data.edges.reduce((map, edge) => {
    const id = `${edge.source}>${edge.target}`;
    const reverseId = `${edge.target}>${edge.source}`;

    if (!map.has(reverseId)) {
      map.set(id, {
        id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
      });
    }

    return map;
  }, new Map<string, Edge>());
  store.dispatch(edges.setEach(index(Array.from(edgeMap.values()), edgeDef)));

  // Introspection Fields
  store.dispatch(
    fields.setEach(
      index(
        data.nodes.reduce<Field[]>((acc, node) => {
          const fs: Field[] = node.fields.map((f) => {
            const edgeId = `${node.id}>${f.type.name}`;
            const reverseEdgeId = `${f.type.name}>${node.id}`;

            return {
              id: `${node.id}.${f.name}`,
              nodeId: node.id,
              edgeId:
                (edgeMap.has(edgeId) && edgeId) ||
                (edgeMap.has(reverseEdgeId) && reverseEdgeId) ||
                undefined,
              isReverse: edgeMap.has(reverseEdgeId) || undefined,
              name: f.name,
              description: f.description || undefined,
              typeKind: f.type.kind,
              typeName: f.type.name,
              isNotNull: f.isNotNull,
              isList: f.isList,
              isListElementNotNull: f.isListElementNotNull || undefined,
            };
          });

          return [...acc, ...fs];
        }, []),
        fieldDef,
      ),
    ),
  );

  return store;
}
