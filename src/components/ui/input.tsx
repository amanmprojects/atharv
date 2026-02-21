'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-xs uppercase tracking-wide mb-2 text-[var(--secondary-text)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'brutalist-input w-full',
            error && 'border-[var(--danger)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--danger)] font-mono">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
