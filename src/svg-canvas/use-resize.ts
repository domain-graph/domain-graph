import { useEffect, useRef } from 'react';

export function useResize(
  element: HTMLElement | null,
  onSize: (values: { width: number; height: number }) => void,
) {
  const callback = useRef<(values: { width: number; height: number }) => void>(
    onSize,
  );
  useEffect(() => {
    callback.current = onSize;
  }, [onSize]);

  const observer = useRef<ResizeObserver>();
  useEffect(() => {
    if (element) {
      observer.current ||= new ResizeObserver(([{ target }]) => {
        callback.current({
          width: target.clientWidth,
          height: target.clientHeight,
        });
      });

      callback.current({
        width: element.clientWidth,
        height: element.clientHeight,
      });

      observer.current.observe(element);
      return () => {
        observer.current?.unobserve(element);
      };
    } else {
      return undefined;
    }
  }, [element]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);
}
