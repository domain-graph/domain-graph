import './index.less';

import React from 'react';

export interface ButtonProps {
  cx?: React.ReactText;
  cy?: React.ReactText;
  r: React.ReactText;
  onClick?(event: React.MouseEvent<SVGCircleElement, MouseEvent>): void;
  className?: string;
}

export const CircleButton: React.FC<ButtonProps> = ({
  cx,
  cy,
  r,
  className,
  children,
  onClick,
}) => {
  return (
    <g
      className={`c-svg-button ${className}`.trim()}
      transform={`translate(${cx || 0} ${cy || 0})`}
    >
      <circle className="background" cx={cx} cy={cy} r={r}></circle>
      {children}
      <circle
        className="click-target"
        cx={cx}
        cy={cy}
        r={r}
        fill="transparent"
        onClick={onClick}
      ></circle>
    </g>
  );
};

export const RectButton: React.FC<React.SVGProps<SVGRectElement>> = (props) => {
  const { className, children, x, x1, y, y1, x2, y2, ...rectProps } = props;

  const { width, height } = getSize(props);

  return (
    <g
      className={`c-svg-button ${className}`.trim()}
      transform={`translate(${x || x1} ${y || y1})`}
    >
      {children}
      <rect
        className="click-target"
        width={width}
        height={height}
        {...rectProps}
      ></rect>
    </g>
  );
};

function getSize({
  x1,
  x2,
  width,
  y1,
  y2,
  height,
}: Pick<
  React.SVGProps<SVGRectElement>,
  'x1' | 'x2' | 'width' | 'y1' | 'y2' | 'height'
>): {
  width: React.ReactText;
  height: React.ReactText;
} {
  if (typeof width !== 'undefined' && typeof height !== 'undefined') {
    return {
      width,
      height,
    };
  } else if (
    typeof x1 !== 'undefined' &&
    typeof x2 !== 'undefined' &&
    typeof y1 !== 'undefined' &&
    typeof y2 !== 'undefined'
  ) {
    return {
      width: Number(x2) - Number(x1),
      height: Number(y2) - Number(y1),
    };
  } else {
    return {
      width: 0,
      height: 0,
    };
  }
}
