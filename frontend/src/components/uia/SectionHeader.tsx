import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SectionHeaderProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export default function SectionHeader({
  as: Component = 'h2',
  className,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <Component
      className={clsx(
        'font-display font-bold uppercase tracking-uia-wide text-uia-blue',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
