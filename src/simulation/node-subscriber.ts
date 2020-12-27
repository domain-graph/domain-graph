import { useContext, useEffect, useRef } from 'react';
import { context } from './context';

export const useNodeSubscriber: NodeSubscriber = (
  nodeId: string,
  onChange: NodeEvent,
): void => {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const subscribe = useContext(context)?.nodeSubscriber;

  useEffect(() => {
    subscribe?.(nodeId, (event, location) => {
      requestAnimationFrame(() => {
        onChangeRef.current?.(event, location);
      });
    });
  }, [subscribe, nodeId]);
};

export interface NodeSubscriber {
  (nodeId: string, onChange: NodeEvent): void;
}

export interface NodeEvent {
  (
    kind: 'dragstart' | 'dragend' | 'drag' | 'tick',
    location: { x: number; y: number },
  ): void;
}
