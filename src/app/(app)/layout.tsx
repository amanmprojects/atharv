'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText, User } from 'lucide-react';
import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="brutalist-border p-4 bg-[var(--surface)]">
          <p className="font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-2 border-[var(--primary)] bg-[var(--background)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileText size={24} strokeWidth={2.5} />
            <span className="font-mono text-lg font-bold uppercase tracking-wide">
              DocDraft
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 brutalist-border bg-[var(--surface)] flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="font-mono text-sm hidden sm:inline">
                {user?.displayName || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
