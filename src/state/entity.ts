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

  readonly standardReducer: Reducer<Prefix, Item, State>;

  patch(key: string, data: Patch<Item>): PatchItem<Prefix, Item> {
    return {
      type: this.PATCH,
      payload: { key, data },
    };
  }

  patchEach(data: Record<string, Patch<Node>>): PatchEachItem<Prefix, Item> {
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
  ): Reducer<Prefix, Item, State> {
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

export type Reducer<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
> = (
  state: State,
  action: FluxStandardAction<
    | PatchItem<Prefix, Item>['type']
    | PatchEachItem<Prefix, Item>['type']
    | SetItem<Prefix, Item>['type']
    | SetEachItem<Prefix, Item>['type']
    | UnsetItem<Prefix>['type']
    | UnsetEachItem<Prefix>['type'],
    any,
    never
  >,
) => State;

export function chainReducers<
  Prefix extends string,
  Item,
  State extends ReducerState<Item>
>(...reducers: Reducer<Prefix, Item, State>[]): Reducer<Prefix, Item, State> {
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
