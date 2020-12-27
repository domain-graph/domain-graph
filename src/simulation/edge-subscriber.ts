import { useRef, useEffect, useContext } from 'react';
import { context } from './context';

export const useEdgeSubscriber: EdgeSubscriber = (
  edgeId: string,
  onChange: EdgeEvent,
) => {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const subscribe = useContext(context)?.edgeSubscriber;

  useEffect(() => {
    subscribe?.(edgeId, (change) => {
      requestAnimationFrame(() => {
        onChangeRef.current?.(change);
      });
    });
  }, [subscribe, edgeId]);
};

export interface EdgeSubscriber {
  (edgeId: string, onChange: EdgeEvent): void;
}
export interface EdgeEvent {
  (location: { x1: number; y1: number; x2: number; y2: number }): void;
}
