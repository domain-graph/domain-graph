import './icon-button.less';

import React, { forwardRef, useMemo } from 'react';
import { IconProps } from '../icons/base';

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
    IconProps {
  Icon: React.VFC<IconProps>;
}

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      className: originalClassName,
      size,
      color,
      strokeWidth,
      x,
      y,
      Icon,
      ...rest
    } = props;

    const iconProps = {
      size,
      color,
      strokeWidth,
      x,
      y,
    };

    const className = useMemo(
      () => ['c-icon-button', originalClassName].filter((c) => c).join(' '),
      [originalClassName],
    );

    return (
      <button ref={ref} className={className} {...rest}>
        <Icon {...iconProps} />
      </button>
    );
  },
);
