'use client';

import { useState } from 'react';
import { Document } from '@/types';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui';
import { FileText, MoreVertical, Trash2, Share2, Download } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  onClick: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function DocumentCard({ document, onClick, onShare, onDelete, onExport }: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card hover className="relative group" onClick={onClick}>
      <div className="aspect-[4/3] bg-[var(--surface)] border border-[var(--border)] mb-3 flex items-center justify-center">
        <FileText size={32} className="text-[var(--secondary-text)]" />
      </div>
      <h3 className="font-mono text-sm font-bold truncate mb-1">{document.title || 'Untitled'}</h3>
      <p className="text-xs text-[var(--secondary-text)] font-mono">
        {formatDate(new Date(document.updatedAt))}
      </p>
      
      <button
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--surface)]"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <MoreVertical size={16} />
      </button>

      {showMenu && (
        <div 
          className="absolute top-10 right-2 bg-[var(--background)] brutalist-border min-w-[120px] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {onShare && (
            <button
              className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-2"
              onClick={() => { onShare(); setShowMenu(false); }}
            >
              <Share2 size={12} /> Share
            </button>
          )}
          {onExport && (
            <button
              className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-2"
              onClick={() => { onExport(); setShowMenu(false); }}
            >
              <Download size={12} /> Export
            </button>
          )}
          {onDelete && (
            <button
              className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] text-[var(--danger)] flex items-center gap-2"
              onClick={() => { onDelete(); setShowMenu(false); }}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
