'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Document } from '@/types';
import { DocumentCard, NewDocumentModal, DashboardHeader } from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/documents?userId=${user.id}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateDocument = async (title: string) => {
    if (!user) return;
    
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ownerId: user.id }),
    });
    
    const data = await response.json();
    if (data.document) {
      router.push(`/docs/${data.document.id}`);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    setDocuments(documents.filter((d) => d.id !== docId));
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="brutalist-border p-4 bg-[var(--surface)]">
          <p className="font-mono text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        onNewDocument={() => setIsNewDocModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="brutalist-border p-8 bg-[var(--surface)] text-center">
              <p className="font-mono text-lg mb-4">No documents found</p>
              <p className="text-sm text-[var(--secondary-text)] mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first document to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsNewDocModalOpen(true)}
                  className="brutalist-btn"
                >
                  Create Document
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid-layout">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={() => router.push(`/docs/${doc.id}`)}
                onDelete={() => handleDeleteDocument(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      <NewDocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onCreate={handleCreateDocument}
      />
    </div>
  );
}
