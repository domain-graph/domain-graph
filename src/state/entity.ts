import {
  Index,
  Patch,
  Definition,
  patch,
  set,
  setEach,
  unset,
  unsetEach,
} from 'flux-standard-functions';
import { FluxStandardAction } from './index';

export class Entity<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
> {
  constructor(
    prefix: Prefix,
    stateDef: Definition<State>,
    itemDef: Definition<Item>,
    initialState: State,
  ) {
    const PREFIX = prefix.toUpperCase() as Uppercase<Prefix>;

    this.PATCH = `${PREFIX}_PATCH_ITEM` as const;
    this.PATCHEACH = `${PREFIX}_PATCHEACH_ITEM` as const;
    this.SET = `${PREFIX}_SET_ITEM` as const;
    this.SETEACH = `${PREFIX}_SETEACH_ITEM` as const;
    this.UNSET = `${PREFIX}_UNSET_ITEM` as const;
    this.UNSETEACH = `${PREFIX}_UNSETEACH_ITEM` as const;

    this.standardReducer = this.createReducer(
      stateDef,
      itemDef,
      initialState,
    ).bind(this);
  }
  // private readonly prefix: Uppercase<Prefix>;

  readonly PATCH: PatchItem<Prefix, any>['type'];
  readonly PATCHEACH: PatchEachItem<Prefix, any>['type'];
  readonly SET: SetItem<Prefix, any>['type'];
  readonly SETEACH: SetEachItem<Prefix, any>['type'];
  readonly UNSET: UnsetItem<Prefix>['type'];
  readonly UNSETEACH: UnsetEachItem<Prefix>['type'];

  readonly standardReducer: StandardReducer<Prefix, Item, State>;

  isPatch(
    action: StandardAction<Prefix, Item>,
  ): action is PatchItem<Prefix, Item> {
    return action.type === this.PATCH && typeof action.payload !== undefined;
  }

  isPatchEach(
    action: StandardAction<Prefix, Item>,
  ): action is PatchEachItem<Prefix, Item> {
    return (
      action.type === this.PATCHEACH && typeof action.payload !== undefined
    );
  }

  isSet(action: StandardAction<Prefix, Item>): action is SetItem<Prefix, Item> {
    return action.type === this.SET && typeof action.payload !== undefined;
  }

  isSetEach(
    action: StandardAction<Prefix, Item>,
  ): action is SetEachItem<Prefix, Item> {
    return action.type === this.SETEACH && typeof action.payload !== undefined;
  }

  isUnset(action: StandardAction<Prefix, Item>): action is UnsetItem<Prefix> {
    return action.type === this.UNSET && typeof action.payload !== undefined;
  }

  isUnsetEach(
    action: StandardAction<Prefix, Item>,
  ): action is UnsetEachItem<Prefix> {
    return (
      action.type === this.UNSETEACH && typeof action.payload !== undefined
    );
  }

  patch(key: string, data: Patch<Item>): PatchItem<Prefix, Item> {
    return {
      type: this.PATCH,
      payload: { key, data },
    };
  }

  patchEach(data: Record<string, Patch<Item>>): PatchEachItem<Prefix, Item> {
    return {
      type: this.PATCHEACH,
      payload: data,
    };
  }

  set(item: Item): SetItem<Prefix, Item> {
    return {
      type: this.SET,
      payload: item,
    };
  }

  setEach(items: Record<string, Item>): SetEachItem<Prefix, Item> {
    return {
      type: this.SETEACH,
      payload: items,
    };
  }

  unset(key: string): UnsetItem<Prefix> {
    return {
      type: this.UNSET,
      payload: key,
    };
  }

  unsetEach(keys: string[]): UnsetEachItem<Prefix> {
    return {
      type: this.UNSETEACH,
      payload: keys,
    };
  }

  private createReducer(
    stateDef: Definition<State>,
    itemDef: Definition<Item>,
    initialState: State,
  ): StandardReducer<Prefix, Item, State> {
    return (state = initialState, action) => {
      switch (action.type) {
        case this.PATCH: {
          const { payload } = action as PatchItem<Prefix, Item>;
          if (!payload) return state;

          return patch(
            state,
            { data: { [payload.key]: payload.data } },
            stateDef,
          );
        }
        case this.PATCHEACH: {
          const { payload } = action as PatchEachItem<Prefix, Item>;

          return patch(state, { data: payload }, stateDef);
        }
        case this.SET: {
          const { payload } = action as SetItem<Prefix, Item>;
          if (!payload) return state;

          const data = set(state.data, payload, itemDef);

          return data === state.data ? state : { ...state, data };
        }
        case this.SETEACH: {
          const { payload } = action as SetEachItem<Prefix, Item>;
          if (!payload) return state;

          const data = setEach(state.data, payload, itemDef);

          return data === state.data ? state : { ...state, data };
        }
        case this.UNSET: {
          const { payload } = action as UnsetItem<Prefix>;
          if (!payload) return state;

          const data = unset(state.data, payload);

          return data === state.data ? state : { ...state, data };
        }
        case this.UNSETEACH: {
          const { payload } = action as UnsetEachItem<Prefix>;
          if (!payload) return state;

          const data = unsetEach(state.data, payload);

          return data === state.data ? state : { ...state, data };
        }
        default:
          return state;
      }
    };
  }
}

export type ReducerState<Item> = {
  data: Index<Item>;
};

export type StandardAction<Prefix extends string, Item> =
  | PatchItem<Prefix, Item>
  | PatchEachItem<Prefix, Item>
  | SetItem<Prefix, Item>
  | SetEachItem<Prefix, Item>
  | UnsetItem<Prefix>
  | UnsetEachItem<Prefix>;

export type StandardType<Prefix extends string, Item> = StandardAction<
  Prefix,
  Item
>['type'];

export type SideEffect<Item, State extends ReducerState<Item>> = (
  originalState: State,
  cuurentState: State,
  action: FluxStandardAction<any, any, any>,
) => State;

export type StandardSideEffect<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
> = (
  originalState: State,
  cuurentState: State,
  action: StandardAction<Prefix, Item>,
) => State;

export type Reducer<Item, State extends ReducerState<Item>> = (
  state: State,
  action: FluxStandardAction<any, any, any>,
) => State;

export type StandardReducer<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
> = (state: State, action: StandardAction<Prefix, Item>) => State;

export function chainReducers<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
>(
  ...reducers: StandardReducer<Prefix, Item, State>[]
): StandardReducer<Prefix, Item, State> {
  return (state, action) =>
    reducers.reduce((nextState, reducer) => reducer(nextState, action), state);
}

export type PatchItem<Prefix extends string, Item> = FluxStandardAction<
  `${Uppercase<Prefix>}_PATCH_ITEM`,
  {
    key: string;
    data: Patch<Item>;
  }
>;

export type PatchEachItem<Prefix extends string, Item> = FluxStandardAction<
  `${Uppercase<Prefix>}_PATCHEACH_ITEM`,
  Index<Patch<Item>>
>;

export type SetItem<Prefix extends string, Item> = FluxStandardAction<
  `${Uppercase<Prefix>}_SET_ITEM`,
  Item
>;

export type SetEachItem<Prefix extends string, Item> = FluxStandardAction<
  `${Uppercase<Prefix>}_SETEACH_ITEM`,
  Index<Item>
>;

export type UnsetItem<Prefix extends string> = FluxStandardAction<
  `${Uppercase<Prefix>}_UNSET_ITEM`,
  string
>;

export type UnsetEachItem<Prefix extends string> = FluxStandardAction<
  `${Uppercase<Prefix>}_UNSETEACH_ITEM`,
  string[]
>;
