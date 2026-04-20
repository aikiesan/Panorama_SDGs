import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'outline' | 'dark' | 'dark-outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center',
          'font-display font-semibold uppercase tracking-uia-wide',
          'rounded-full transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Size variants
          {
            'px-4 py-2 text-xs': size === 'sm',
            'px-6 py-2.5 text-uia-button': size === 'md',
            'px-8 py-3 text-sm': size === 'lg',
          },

          // Variant styles
          {
            'bg-uia-blue text-white border-2 border-uia-blue hover:bg-uia-violet hover:border-uia-violet':
              variant === 'primary',
            'bg-transparent text-uia-blue border border-uia-dark hover:text-uia-red hover:border-uia-red':
              variant === 'outline',
            // UIA Official Dark Button Pattern
            'bg-uia-dark-button border-none text-white hover:bg-uia-dark-button-hover':
              variant === 'dark',
            'bg-transparent border-2 border-uia-dark-button text-uia-dark-button hover:bg-uia-dark-button hover:text-white hover:border-uia-dark-button':
              variant === 'dark-outline',
          },

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'UIAButton';
export default Button;
