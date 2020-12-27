import { act, renderHook } from '@testing-library/react-hooks';

import { Clone, StableCloneProps, useStableClone } from './use-stable-clone';

type Item = {
  id: string;
  value: number;
};

type ClonedItem = {
  id: string;
  value: number;
  stringValue: string;
  hasNonZeroValue: boolean;
};

function render(initialProps: StableCloneProps<Item, ClonedItem>) {
  return renderHook((p) => useStableClone(p), { initialProps });
}

describe('useStableClone', () => {
  describe('without custom mapping', () => {
    it('works with empty arrays', () => {
      // ARRANGE
      const items: Item[] = [];
      const expected: Clone<Item, ClonedItem>[] = [];

      // ACT
      const { result } = render({ items, keyProp: 'id' });

      // ASSERT
      expect(sort(result.current).by('id')).toEqual(sort(expected).by('id'));
    });

    it('works with a non-empty array', () => {
      // ARRANGE
      const items: Item[] = [
        {
          id: 'a',
          value: 123,
        },
      ];

      const expected: Clone<Item, ClonedItem>[] = [
        {
          id: 'a',
          value: 123,
        },
      ];

      // ACT
      const { result } = render({ items, keyProp: 'id' });

      // ASSERT
      expect(sort(result.current).by('id')).toEqual(sort(expected).by('id'));
    });

    it('preserves reference equality on cloned items', () => {
      // ARRANGE
      const firstItems: Item[] = [
        {
          id: 'a',
          value: 123,
        },
      ];

      const secondItems: Item[] = [
        {
          id: 'a',
          value: 987,
        },
      ];

      const expected: Clone<Item, ClonedItem>[] = [
        {
          id: 'a',
          value: 123,
        },
      ];

      // ACT
      const { result, rerender } = render({ items: firstItems, keyProp: 'id' });

      const original = result.current.find((item) => item.id === 'a');

      expect(original?.value).toBe(123);

      act(() => {
        rerender({ items: secondItems, keyProp: 'id' });
      });

      const updated = result.current.find((item) => item.id === 'a');

      // ASSERT
      expect(original === updated).toBe(true);
      expect(original?.value).toBe(987);
      expect(updated?.value).toBe(987);
    });
  });

  describe('with cusom mapping', () => {
    it('works with a non-empty array', () => {
      // ARRANGE
      const items: Item[] = [
        {
          id: 'a',
          value: 123,
        },
      ];

      const expected: Clone<Item, ClonedItem>[] = [
        {
          id: 'a',
          value: 123,
          stringValue: '123',
          hasNonZeroValue: true,
        },
      ];

      const customMapping = (
        item: Item,
        cloned: ClonedItem,
      ): Partial<ClonedItem> => ({
        stringValue: `${item.value}`,
        hasNonZeroValue: item.value !== 0,
      });

      // ACT
      const { result } = render({ items, keyProp: 'id', customMapping });

      // ASSERT
      expect(sort(result.current).by('id')).toEqual(sort(expected).by('id'));
    });
  });
});

const sort = <T>(array: T[]) => ({
  by(key: keyof PickType<T, string | number>): T[] {
    return [...array].sort((a, b) => {
      const aa = a[key];
      const bb = b[key];
      if (isString(aa) && isString(bb)) {
        return aa.localeCompare(bb);
      } else if (isNumber(aa) && isNumber(bb)) {
        return bb - aa;
      } else {
        return 0;
      }
    });
  },
});

function isString(value: any): value is string {
  return typeof value === 'string';
}
function isNumber(value: any): value is number {
  return typeof value === 'number';
}

type KeysOfType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
}[keyof Base];

type PickType<Base, Condition> = Pick<Base, KeysOfType<Base, Condition>>;
