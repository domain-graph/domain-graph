import React, { useLayoutEffect, useMemo, useRef } from 'react';

export interface RadialMenuProps {
  isVisible: boolean | null;
  radius: number;
  spread: number;
  margin: number;
}

export const RadialMenu: React.FC<RadialMenuProps> = (props) => {
  const { children, ...itemProps } = props;

  const count = React.Children.count(children);

  return (
    <g
      className="c-radial-menu"
      pointerEvents={props.isVisible ? 'auto' : 'none'}
      cursor="default"
    >
      {props.children &&
        React.Children.map(props.children, (_, i) => (
          <Margin index={i} count={count} {...itemProps} />
        ))}
      {props.children &&
        React.Children.map(props.children, (child, i) => (
          <MenuItem index={i} count={count} {...itemProps}>
            {child}
          </MenuItem>
        ))}
    </g>
  );
};

interface MenuItemProps extends RadialMenuProps {
  index: number;
  count: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  index,
  count,
  radius,
  spread,
  children,
  isVisible,
}) => {
  const g = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const angle = getAngle(count, index, spread);
    const tick = (v: number) => {
      g.current?.setAttribute(
        'transform',
        `rotate(${angle}) translate(0 ${-v * radius}) rotate(${-angle})`,
      );
      g.current?.setAttribute('opacity', `${v}`);
    };
    if (isVisible) {
      enter({ tick });
    } else if (g.current?.transform?.baseVal?.numberOfItems) {
      exit({ tick });
    }
  }, [isVisible, count, index, radius, spread]);

  return <g ref={g}>{children}</g>;
};

const Margin: React.FC<MenuItemProps> = ({
  index,
  count,
  radius,
  spread,
  isVisible,
  margin,
}) => {
  const line = useRef<SVGLineElement>(null);

  useLayoutEffect(() => {
    const angle = getAngle(count, index, spread);
    const tick = (v: number) => {
      line.current?.setAttribute('y2', `${-v * radius}`);
      line.current?.setAttribute('transform', `rotate(${angle})`);
    };
    if (isVisible) {
      enter({ tick });
    } else if (line.current?.transform?.baseVal?.numberOfItems) {
      exit({ tick });
    }
  }, [isVisible, count, index, radius, spread]);

  return (
    <line
      ref={line}
      strokeWidth={margin}
      x1="0"
      y1="0"
      x2="0"
      stroke="transparent"
      strokeLinecap="round"
    />
  );
};

const enter = (params: Pick<TweenOptions, 'start' | 'tick' | 'done'>) =>
  tween({ duration: 75, easing: linear, ...params });
const exit = (params: Pick<TweenOptions, 'start' | 'tick' | 'done'>) =>
  tween({ duration: 75, easing: linear, reverse: true, ...params });

interface TweenOptions {
  delay?: number;
  duration: number;
  easing: (t: number) => number;
  reverse?: boolean;
  start?: (value: number) => void;
  tick?: (value: number) => void;
  done?: (value: number) => void;
}

function tween({
  delay = 0,
  duration,
  easing,
  reverse,
  start,
  tick,
  done,
}: TweenOptions): void {
  setTimeout(() => {
    const s = performance.now();

    start?.(reverse ? 1 : 0);

    const doit = () => {
      requestAnimationFrame(() => {
        const now = performance.now();

        if (now - s > duration) {
          tick?.(reverse ? 0 : 1);
          done?.(reverse ? 0 : 1);
        } else {
          const t = (now - s) / duration;
          tick?.(easing(reverse ? 1 - t : t));
          doit();
        }
      });
    };
    doit();
  }, delay);
}

// TODO: create non-linear functions
function linear(t: number) {
  return t;
}

function getAngle(count: number, index: number, spread: number) {
  return ((count - 1) / 2 - index) * spread;
}
