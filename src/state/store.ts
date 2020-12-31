import { IntrospectionQuery } from 'graphql';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';

import { reducers } from '.';
// import { getRegistry } from '../registry';
import { interospectionHeuristic } from '../tools/factory/heuristics/introspection';
import { connectionHeuristic } from '../tools/factory/heuristics/relay-connection';

import { importState } from './graph/actions';
import { getInitialState } from '../tools/factory/factory-2.0';
import { defaultState } from './graph';

const composeEnhancers =
  window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;
// const registry = getRegistry();

export type ApplicationStore = Store<ReturnType<typeof reducers>>;

export async function getStore(
  introspection: IntrospectionQuery,
): Promise<ApplicationStore> {
  const store = createStore(
    reducers,
    { graph: defaultState },
    composeEnhancers(applyMiddleware(thunk)),
  );

  const { nodes, edges, fields, args } = getInitialState(introspection, [
    connectionHeuristic,
    interospectionHeuristic,
  ]);

  store.dispatch(importState(nodes, edges, fields, args, []));

  return store;
}
