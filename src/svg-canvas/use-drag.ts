import { useCallback, useEffect, useRef } from 'react';

interface DragState {
  element: HTMLElement | SVGElement | null;
  beginX: number;
  beginY: number;
  currentX: number;
  currentY: number;
}

export interface DragOptions {
  onMove?: (values: MoveValues) => void;
  onBegin?: (values: BeginValues) => void;
  onEnd?: (values: EndValues) => void;
}

export interface MoveValues {
  beginX: number;
  beginY: number;
  currentX: number;
  currentY: number;
  dx: number;
  dy: number;
}
export interface BeginValues {
  beginX: number;
  beginY: number;
}
export interface EndValues {
  beginX: number;
  beginY: number;
  endX: number;
  endY: number;
}

export function useDrag(
  element: HTMLElement | SVGElement | null,
  options?: DragOptions,
) {
  const state = useRef<DragState>({
    element: null,
    beginX: 0,
    beginY: 0,
    currentX: 0,
    currentY: 0,
  });

  const callbacks = useRef<DragOptions>(options || {});
  useEffect(() => {
    callbacks.current = options || {};
  }, [options]);

  const handleMouseMove = useRef((e: MouseEvent) => {
    if (state.current) {
      const newX = e.offsetX;
      const newY = e.offsetY;

      const { beginX, beginY, currentX, currentY } = state.current;

      state.current.currentX = newX;
      state.current.currentY = newY;

      callbacks.current.onMove?.({
        beginX: beginX,
        beginY: beginY,
        currentX: newX,
        currentY: newY,
        dx: newX - currentX,
        dy: newY - currentY,
      });
    }
  });

  const handleMouseUp = useRef((e: MouseEvent) => {
    const { beginX, beginY } = state.current;
    callbacks.current.onEnd?.({
      beginX,
      beginY,
      endX: e.offsetX,
      endY: e.offsetY,
    });

    document.removeEventListener('mouseup', handleMouseUp.current);
    state.current.element?.removeEventListener(
      'mousemove',
      handleMouseMove.current,
    );
  });

  const handleMouseDown = useRef((e: MouseEvent) => {
    if (e.button === 0 && e.target === state.current.element) {
      state.current.beginX = e.offsetX;
      state.current.beginY = e.offsetY;
      state.current.currentX = e.offsetX;
      state.current.currentY = e.offsetY;

      callbacks.current.onBegin?.({ beginX: e.offsetX, beginY: e.offsetY });

      document.addEventListener('mouseup', handleMouseUp.current);
      state.current.element?.addEventListener(
        'mousemove',
        handleMouseMove.current,
      );
    }
  });

  useEffect(() => {
    if (element) {
      state.current.element = element;
      const onMouseDown = handleMouseDown.current;
      const onMouseUp = handleMouseUp.current;
      const mousemove = handleMouseMove.current;

      element.addEventListener('mousedown', onMouseDown);
      return () => {
        state.current.element = null;
        element.removeEventListener('mousedown', onMouseDown);
        element.removeEventListener('mouseup', onMouseUp);
        element.removeEventListener('mousemove', mousemove);
      };
    } else {
      return undefined;
    }
  }, [element]);
}
