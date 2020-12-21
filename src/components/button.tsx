import './button.less';

import React, { forwardRef } from 'react';

export type ButtonProps = React.ComponentPropsWithoutRef<'button'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { className: originalClassName, ...rest } = props;

    const className = originalClassName
      ? `c-button ${originalClassName}`
      : 'c-button';

    return (
      <button className={className} {...rest}>
        {props.children}
      </button>
    );
  },
);
