import { Action } from './state/graph/reducer';

export interface Test {
  <ActionType extends Action['type']>(
    type: ActionType,
    fn: (typeUnderTest: ActionType) => void,
  ): void;
}
export interface Describe extends Test {
  /** Only runs the tests inside this `describe` for the current file */
  only: Describe;
  /** Skips running the tests inside this `describe` for the current file */
  skip: Describe;
  each: jest.Each;
}

export function test<ActionType extends Action['type']>(
  type: ActionType,
  fn: (typeUnderTest: ActionType) => void,
) {
  const jestFn = () => {
    fn(type);
  };

  describe(`Action type: "${type}"`, jestFn);
}

export const describeAction: Describe = test as any;
describeAction.only = describe.only as any;
describeAction.skip = describe.skip as any;
describeAction.each = describe.each as any;
