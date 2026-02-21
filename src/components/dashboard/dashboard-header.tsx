'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { FolderPlus } from 'lucide-react';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export function NewDocumentModal({ isOpen, onClose, onCreate }: NewDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(title || 'Untitled Document');
      setTitle('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Document">
      <form onSubmit={handleSubmit}>
        <Input
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title..."
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface DashboardHeaderProps {
  onNewDocument: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardHeader({ onNewDocument, searchQuery, onSearchChange }: DashboardHeaderProps) {
  return (
    <div className="border-b-2 border-[var(--primary)] bg-[var(--background)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wide">Documents</h1>
          <Button onClick={onNewDocument} className="flex items-center gap-2">
            <FolderPlus size={16} />
            New Document
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents..."
            className="max-w-md"
          />
        </div>
      </div>
    </div>
  );
}
