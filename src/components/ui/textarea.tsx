'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-xs uppercase tracking-wide mb-2 text-[var(--secondary-text)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'brutalist-input w-full min-h-[100px] resize-y',
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

Textarea.displayName = 'Textarea';
