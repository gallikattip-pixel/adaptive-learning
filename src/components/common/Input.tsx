import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type = 'text', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-dark-text/90">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full bg-ivory border border-deep-green/40 rounded-lg px-3.5 py-2.5 text-sm text-dark-text placeholder-muted transition-colors focus:outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/60 disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-amber-700 focus:border-amber-700 focus:ring-amber-700/60',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-amber-800 font-medium mt-0.5">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted mt-0.5">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
