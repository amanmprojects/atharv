'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui';
import { FileText } from 'lucide-react';

export function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="brutalist-border bg-[var(--surface)] p-8">
          <div className="flex items-center gap-3 mb-8 border-b-2 border-[var(--primary)] pb-6">
            <FileText size={32} strokeWidth={2.5} />
            <h1 className="font-mono text-2xl font-bold uppercase tracking-wide">
              DocDraft
            </h1>
          </div>
          
          <p className="text-[var(--secondary-text)] mb-6 font-mono text-sm">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
