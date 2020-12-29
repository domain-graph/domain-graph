import { combineReducers } from 'redux';
import { Registry } from '../registry';
import { edges } from './edges';
import { fields } from './fields';
import { nodes } from './nodes';
import { OmitByType } from '../utils';

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

export const reducers = combineReducers({
  edges: edges.reducer,
  fields: fields.reducer,
  nodes: nodes.reducer,
});

export type ApplicationState = OmitByType<
  ReturnType<typeof reducers>,
  undefined
>;
