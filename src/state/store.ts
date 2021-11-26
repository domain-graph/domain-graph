import { DocumentNode } from 'graphql';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';

import { reducers } from '.';

import { importSaveState, importState } from './graph/graph-actions';
import { factory } from '../tools/factory/factory-3.0';
import { defaultState } from './graph';
import { SaveState, SaveStateRepository } from '../persistence';
import { deindex } from 'flux-standard-functions';
import { connections } from '../tools/factory/plugins/connections';

const composeEnhancers =
  window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;

export type ApplicationStore = Store<ReturnType<typeof reducers>>;

export async function getStore(
  graphId: string,
  documentNode: DocumentNode,
  repository: SaveStateRepository,
  initialSaveState?: SaveState,
): Promise<{ store: ApplicationStore; unsubscribe: () => void }> {
  const store = createStore(
    reducers,
    { graph: defaultState },
    composeEnhancers(applyMiddleware(thunk)),
  );

  const {
    nodes,
    edges,
    fields,
    args,
    enums,
    enumValues,
    inputs,
    inputFields,
  } = factory(documentNode, [connections]);

  store.dispatch(
    importState(
      deindex(nodes),
      deindex(edges),
      deindex(fields),
      deindex(args),
      deindex(enums),
      deindex(enumValues),
      deindex(inputs),
      deindex(inputFields),
      [],
    ),
  );

  const saveState = initialSaveState || (await repository.get(graphId));

  if (saveState) store.dispatch(importSaveState(saveState));

  const unsubscribe = store.subscribe(() => {
    // TODO: debounce (issue #43)

    const {
      visibleNodes,
      selectedSourceNodeId,
      selectedFieldId,
      selectedTargetNodeId,
    } = store.getState().graph;

    repository.set(graphId, {
      graph: {
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
