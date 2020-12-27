import { useState, useRef, useEffect } from 'react';

export type Clone<TItem, TClone extends TItem> = TItem & Partial<TClone>;

export interface StableCloneProps<TItem, TClone extends TItem> {
  items: TItem[];
  keyProp: keyof TItem;
  // initialValues?: Clone<TItem, TClone>[];
  customMapping?: (
    a: TItem,
    b: Clone<TItem, TClone>,
  ) => Partial<Clone<TItem, TClone>>;
}

export function useStableClone<TItem, TClone extends TItem>({
  items,
  keyProp,
  // initialValues,
  customMapping,
}: StableCloneProps<TItem, TClone>): Clone<TItem, TClone>[] {
  type C = Clone<TItem, TClone>;

  const [clonedNodes, setClonedNodes] = useState<C[]>(
    items.map((item) => ({ ...item })),
  );

  useEffect(() => {
    setClonedNodes((prevClones) =>
      items.map((nextItem) => {
        const prevClone = prevClones.find(
          (n) => nextItem[keyProp] === n[keyProp],
        );

        if (prevClone) {
          for (const key of Object.keys(nextItem)) {
            prevClone[key] = nextItem[key];
          }

          if (customMapping) {
            const customMap = customMapping(nextItem, prevClone);
            for (const key of Object.keys(customMapping(nextItem, prevClone))) {
              prevClone[key] = customMap[key];
            }
          }

          return prevClone;
        } else {
          return { ...nextItem };
        }
      }),
    );
  }, [items, customMapping, keyProp]);

  return clonedNodes;
}
