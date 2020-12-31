import { IntrospectionQuery } from 'graphql';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';
import { index } from 'flux-standard-functions';

import { ApplicationState, reducers } from '.';
import { StateRepository } from '../graph-state/types';
import { getRegistry } from '../registry';
import { interospectionHeuristic } from '../tools/factory/heuristics/introspection';
import { connectionHeuristic } from '../tools/factory/heuristics/relay-connection';

import { nodeDef, nodes as nodesEntity } from './nodes';
import { edgeDef, edges as edgesEntity } from './edges';
import { fieldDef, fields as fieldsEntity } from './fields';
import { getInitialState } from '../tools/factory/factory-2.0';

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

  const { nodes, edges, fields } = getInitialState(introspection, [
    connectionHeuristic,
    interospectionHeuristic,
  ]);

  store.dispatch(nodesEntity.setEach(index(nodes, nodeDef)));
  store.dispatch(edgesEntity.setEach(index(edges, edgeDef)));
  store.dispatch(fieldsEntity.setEach(index(fields, fieldDef)));

  return store;
}
