import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-dark-green focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg';

    const variants = {
      primary:
        'bg-yellow hover:bg-[#d9b73b] text-dark-green font-bold shadow-md active:translate-y-[1px]',
      secondary:
        'bg-deep-green hover:bg-[#184835] text-ivory border border-deep-green shadow-sm active:translate-y-[1px]',
      outline:
        'border border-deep-green hover:border-yellow text-ivory hover:bg-deep-green/40 active:translate-y-[1px]',
      ghost: 'text-ivory/80 hover:text-ivory hover:bg-deep-green/30',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-10 gap-2',
      lg: 'text-base px-6 py-3 h-12 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
