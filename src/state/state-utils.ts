export type Reducer<State, Action extends { type: string }> = (
  state: State,
  action: Action,
) => State;

export function chainReducers<State, Action extends { type: string }>(
  ...reducers: Reducer<State, Action>[]
): Reducer<State, Action> {
  return (state, action) => {
    let nextState = state;
    for (const reducer of reducers) {
      nextState = reducer(nextState, action);
    }

    return nextState;
  };
}
