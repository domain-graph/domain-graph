import { IntrospectionQuery } from 'graphql';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';

import { reducers } from '.';
// import { getRegistry } from '../registry';
import { interospectionHeuristic } from '../tools/factory/heuristics/introspection';
import { connectionHeuristic } from '../tools/factory/heuristics/relay-connection';

import { importSaveState, importState } from './graph/graph-actions';
import { getInitialState } from '../tools/factory/factory-2.0';
import { defaultState } from './graph';
import { SaveState, SaveStateRepository } from '../persistence';

const composeEnhancers =
  window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;

export type ApplicationStore = Store<ReturnType<typeof reducers>>;

export async function getStore(
  graphId: string,
  introspection: IntrospectionQuery,
  repository: SaveStateRepository,
  initialSaveState?: SaveState,
): Promise<{ store: ApplicationStore; unsubscribe: () => void }> {
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

  const saveState = initialSaveState || (await repository.get(graphId));

  if (saveState) store.dispatch(importSaveState(saveState));

  const unsubscribe = store.subscribe(() => {
    // TODO: debounce (issue #43)

    const {
      argEdits,
      edgeEdits,
      fieldEdits,
      nodeEdits,
      visibleNodes,
      selectedSourceNodeId,
      selectedFieldId,
      selectedTargetNodeId,
    } = store.getState().graph;

    repository.set(graphId, {
      graph: {
        argEdits,
        edgeEdits,
        fieldEdits,
        nodeEdits,
        visibleNodes,
        selectedSourceNodeId,
        selectedFieldId,
        selectedTargetNodeId,
      },
      canvas: { scale: 1, x: 0, y: 0 },
    });
  });

  return { store, unsubscribe };
}
