import { useState, useRef, useEffect } from 'react';

export function useStableClone<TItem, TClone extends TItem>(
  items: TItem[],
  compare: (a: TItem, b: TItem & Partial<Omit<TClone, keyof TItem>>) => boolean,
): (TItem & Partial<Omit<TClone, keyof TItem>>)[] {
  type C = TItem & Partial<Omit<TClone, keyof TItem>>;

  const [clonedNodes, setClonedNodes] = useState<C[]>(
    items.map((item) => ({ ...item })),
  );

  const compareFn = useRef(compare);
  useEffect(() => {
    compareFn.current = compare;
  }, [compare]);

  useEffect(() => {
    setClonedNodes((prev) =>
      items.map((nextNode) => {
        const prevNode = prev.find((n) => compareFn.current(nextNode, n));

        if (prevNode) {
          for (const key of Object.keys(nextNode)) {
            prevNode[key] = nextNode[key];
          }

          // TODO: move to a better place
          // This assumes knowledge of the node type
          if (prevNode) {
            if (nextNode?.['fixed'] === true) {
              prevNode['fx'] = prevNode['x'];
              prevNode['fy'] = prevNode['y'];
              prevNode['vx'] = 0;
              prevNode['vy'] = 0;
            } else if (nextNode?.['fixed'] === false) {
              prevNode['fx'] = null;
              prevNode['fy'] = null;
            }
          }

          return prevNode;
        } else {
          return { ...nextNode };
        }
      }),
    );
  }, [items]);

  return clonedNodes;
}
