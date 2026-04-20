import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type CardCategory = 'tools' | 'resources' | 'priority' | 'neutral';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light' | 'featured';
  category?: CardCategory;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'light', category = 'priority', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-none border p-8',
          {
            'bg-white border-uia-dark': variant === 'default',
            'bg-uia-gray-light border-uia-dark': variant === 'light',
            'bg-white border-uia-dark border-l-5 transition-all duration-200 hover:shadow-uia-card-hover': variant === 'featured',
          },
          // Featured border colors by category
          variant === 'featured' && {
            'border-l-uia-blue': category === 'tools',
            'border-l-uia-violet': category === 'resources',
            'border-l-uia-red': category === 'priority',
            'border-l-uia-dark-button': category === 'neutral',
          },
          // Featured hover state
          variant === 'featured' && 'hover:border-l-uia-dark-button',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'UIACard';
export default Card;
