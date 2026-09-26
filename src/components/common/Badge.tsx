import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'yellow' | 'deepGreen' | 'darkGreen' | 'ivory' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'yellow', children, ...props }) => {
  const variants = {
    yellow: 'bg-yellow text-dark-green font-bold border border-yellow/60 shadow-xs',
    deepGreen: 'bg-deep-green text-ivory border border-deep-green/80',
    darkGreen: 'bg-dark-green text-ivory border border-deep-green',
    ivory: 'bg-warm-ivory text-dark-text border border-deep-green/30',
    outline: 'border border-deep-green/60 text-dark-text',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
