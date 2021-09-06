import './pill-button.less';

import React, { forwardRef, useMemo } from 'react';
import { IconProps } from '../icons/base';

export interface PillButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
  Omit<IconProps, 'size'> {
  children: string | number;
  icon: React.VFC<IconProps>;
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  (props, ref) => {
    const {
      children,
      className: originalClassName,
      color,
      strokeWidth,
      x,
      y,
      icon: Icon,
      ...buttonProps
    } = props;

    const iconProps: IconProps = {
      size: 14,
      color,
      strokeWidth,
      x,
      y,
    };

    const className = useMemo(
      () => ['c-pill-button', originalClassName].filter((c) => c).join(' '),
      [originalClassName],
    );

    return (
      <button ref={ref} className={className} {...buttonProps}>
        <Icon {...iconProps} />
        {children}
      </button>
    );
  },
);
