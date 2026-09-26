import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'elevated' | 'outline';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-warm-ivory border border-deep-green/20 text-dark-text shadow-sm',
      dark: 'bg-dark-green border border-deep-green text-ivory shadow-md',
      elevated: 'bg-ivory border border-deep-green/30 text-dark-text shadow-lg',
      outline: 'bg-transparent border border-deep-green/30 text-dark-text',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl p-6 transition-all duration-200', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
