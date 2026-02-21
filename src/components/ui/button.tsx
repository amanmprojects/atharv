'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ai' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-mono font-semibold uppercase tracking-wide transition-all duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none',
          {
            'brutalist-btn': variant === 'primary',
            'brutalist-btn-outline': variant === 'outline',
            'brutalist-btn-ai': variant === 'ai',
            'bg-transparent text-[var(--danger)] border-[var(--danger)] border-2 hover:bg-[var(--danger)] hover:text-white': variant === 'danger',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2 text-xs': size === 'md',
            'px-6 py-3 text-sm': size === 'lg',
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

Button.displayName = 'Button';
