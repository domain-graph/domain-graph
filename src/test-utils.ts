import { EditAction } from './state/graph/edit-actions';
import { GraphAction } from './state/graph/graph-actions';

export interface Test {
  <ActionType extends EditAction['type'] | GraphAction['type']>(
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

export function test<
  ActionType extends EditAction['type'] | GraphAction['type']
>(type: ActionType, fn: (typeUnderTest: ActionType) => void) {
  const jestFn = () => {
    fn(type);
  };

  describe(type, jestFn);
}

export const describeAction: Describe = test as any;
describeAction.only = describe.only as any;
describeAction.skip = describe.skip as any;
describeAction.each = describe.each as any;
