import { combineReducers } from 'redux';
import { Registry } from '../registry';
import { reducer as edgesReducer } from './edges';
import { reducer as fieldsReducer } from './fields';
import { reducer as nodesReducer } from './nodes';
import { OmitByType } from '../utils';
import {
  useSelector as useOriginalSelector,
  useDispatch as useOriginalDispatch,
} from 'react-redux';

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

export function useSelector<T>(
  selector: (state: ApplicationState) => T,
  equalityFn?: ((left: T, right: T) => boolean) | undefined,
): T {
  return useOriginalSelector(selector, equalityFn);
}

export function useDispatch<ThunkResult>(): Dispatch<ThunkResult> {
  return useOriginalDispatch();
}

export type Dispatch<ThunkResult> = <
  Action extends FluxStandardAction<any, any, any> | Thunk<ThunkResult>
>(
  action: Action,
) => Action extends FluxStandardAction<any, any, any>
  ? void
  : Promise<ThunkResult>;

export type Thunk<ThunkResult = void> = (
  dispatch: Dispatch<ThunkResult>,
  getState: () => ApplicationState,
  registry: Registry,
) => Promise<ThunkResult>;

export const reducers = combineReducers({
  edges: edgesReducer,
  fields: fieldsReducer,
  nodes: nodesReducer,
});

export type ApplicationState = OmitByType<
  ReturnType<typeof reducers>,
  undefined
>;
