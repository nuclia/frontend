import { forwardRef } from 'react';
import type { SVGAttributes } from 'react';
import './Icon.css';

export type IconSize = 'sm' | 'md' | 'lg';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  icon: string;
  size?: IconSize;
  title?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(({ icon, size = 'md', title, className, ...rest }, ref) => {
  const ariaHidden = title ? undefined : true;
  const role = title ? 'img' : undefined;

  return (
    <>
      <svg
        ref={ref}
        className={`icon icon-${size} ${className}`}
        viewBox="0 0 24 24"
        focusable="false"
        aria-hidden={ariaHidden}
        role={role}
        {...rest}>
        {title ? <title>{title}</title> : null}
        <use href={`#${icon}`} />
      </svg>
    </>
  );
});

Icon.displayName = 'Icon';
