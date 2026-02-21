'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div 
        className={cn(
          'relative bg-[var(--background)] brutalist-border w-full max-w-lg mx-4 z-10',
          className
        )}
      >
        <div className="flex items-center justify-between border-b-2 border-[var(--primary)] p-4">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--surface)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-[var(--background)] brutalist-border w-full max-w-lg mx-4 z-10">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-[var(--primary)] p-4 pb-3">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-mono text-sm font-bold uppercase tracking-wide">{children}</h2>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t-2 border-[var(--border)] p-4 pt-3">
      {children}
    </div>
  );
}
