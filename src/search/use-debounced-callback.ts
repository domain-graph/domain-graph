import { useRef, useCallback } from 'react';

export const useDebouncedCallback = <Args extends any[]>(
  fn: (...args: Args) => void,
  ms: number,
) => {
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Args) => {
      const deferred = () => {
        timeout.current && clearTimeout(timeout.current);
        fn(...args);
      };

      timeout.current && clearTimeout(timeout.current);
      timeout.current = setTimeout(deferred, ms);
    },
    [fn, ms],
  );
};
