import { combineReducers } from 'redux';
import { Registry } from '../registry';
import { nodeReducer, NodeReducerState } from './nodes/reducer';

export type FluxStandardAction<
  TType extends string = string,
  TPayload = void,
  TMeta = void
> = {
  type: TType;
  payload: TPayload;
  error?: boolean;
  meta?: TMeta;
};

export type Thunk<T = void> = (
  dispatch: (action: FluxStandardAction<any, any, any> | Thunk<any>) => any,
  getState: () => ApplicationState,
  registry: Registry,
) => Promise<T>;

export type ApplicationState = {
  nodes: NodeReducerState;
};

export const reducers = combineReducers({
  nodes: nodeReducer,
});
