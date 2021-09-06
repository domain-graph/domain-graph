import React, {
  useCallback,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

import { useDrag } from './use-drag';
import { useResize } from './use-resize';
import { useZoom } from './use-zoom';

export interface SvgCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

interface State {
  wrapper: HTMLDivElement | null;
  canvas: SVGSVGElement | null;
  transformGroup: SVGGElement | null;
  postX: number;
  postY: number;
  preX: number;
  preY: number;
  scale: number;
  width: number;
  height: number;
}

export interface SvgCanvasMethods {
  resetZoom(): void;
  fitAll(): void;
}

export const SvgCanvas = forwardRef<
  SvgCanvasMethods,
  React.PropsWithChildren<SvgCanvasProps>
>(({ className, style, children }, forwardedRef) => {
  const [isDragging, setIsDragging] = useState(false);
  const state = useRef<State>({
    wrapper: null,
    canvas: null,
    transformGroup: null,
    postX: 0,
    postY: 0,
    preX: 0,
    preY: 0,
    scale: 1,
    width: 300,
    height: 150,
  });

  const divRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(forwardedRef, () => ({
    resetZoom: () => {
      setZoom(1);

      state.current.preX = 0;
      state.current.preY = 0;

      state.current.postX = 0;
      state.current.postY = 0;

      state.current.scale = 1;

      updateFn.current();
    },
    fitAll: () => {
      console.log('fitAll');
    },
  }));

  const [canvas, setCanvas] = useState<SVGSVGElement | null>(null);
  const canvasRef = useCallback((element: SVGSVGElement) => {
    setCanvas(element);
    state.current.canvas = element;
  }, []);

  const transformGroupRef = useCallback((element: SVGGElement) => {
    state.current.transformGroup = element;
  }, []);

  const updateFn = useRef(() => {
    requestAnimationFrame(() => {
      const { width, height, postX, postY, preX, preY, scale } = state.current;

      state.current.canvas?.setAttribute('viewBox', `0 0 ${width} ${height}`);
      state.current.canvas?.setAttribute('width', `${width}px`);
      state.current.canvas?.setAttribute('height', `${height}px`);

      const pre = `translate(${width / 2 + preX} ${height / 2 + preY})`;
      const zoom = `scale(${round1000(scale)})`;
      const post = `translate(${-round10(postX)} ${-round10(postY)})`;

      state.current.transformGroup?.setAttribute(
        'transform',
        pre + zoom + post,
      );
    });
  });

  useDrag(canvas, {
    onMove: ({ dx, dy }) => {
      state.current.preX += dx;
      state.current.preY += dy;

      updateFn.current();
    },
    onBegin: () => setIsDragging(true),
    onEnd: () => setIsDragging(false),
  });

  const setZoom = useZoom(canvas, ({ value, x, y }) => {
    const centerX = state.current.width / 2;
    const centerY = state.current.height / 2;

    const newPreX = x - centerX;
    const newPreY = y - centerY;

    const dx = newPreX - state.current.preX;
    const dy = newPreY - state.current.preY;

    state.current.preX = newPreX;
    state.current.preY = newPreY;

    state.current.postX += dx / state.current.scale;
    state.current.postY += dy / state.current.scale;

    state.current.scale = value;

    updateFn.current();
  });

  useResize(divRef.current, ({ width, height }) => {
    state.current.width = width;
    state.current.height = height;

    updateFn.current();
  });

  return (
    <div
      ref={divRef}
      className={`c-svg-canvas${className ? ' ' + className : ''}${
        isDragging ? ' dragging' : ''
      }`}
      style={style}
    >
      <svg ref={canvasRef}>
        <g ref={transformGroupRef}>{children}</g>
      </svg>
    </div>
  );
});

function round10(value: number): number {
  return Math.round(value * 10.0) / 10.0;
}

function round1000(value: number): number {
  return Math.round(value * 1000.0) / 1000.0;
}
