import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { getSDGColor } from '../../utils/assets';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  sdg: number; // 1-17
  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({
  sdg,
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full text-white font-bold',
        {
          'w-7 h-7 text-xs': size === 'sm',
          'w-9 h-9 text-sm': size === 'md',
          'w-12 h-12 text-base': size === 'lg',
        },
        className
      )}
      style={{ backgroundColor: getSDGColor(sdg) }}
      {...props}
    >
      {sdg}
    </div>
  );
}
