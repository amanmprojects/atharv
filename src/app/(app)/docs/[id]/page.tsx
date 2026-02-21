'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor';
import { Document, UserPresence } from '@/types';
import { useAuth } from '@/context/auth-context';
import { assignCursorColor } from '@/types/user';

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const docId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !docId) return;

    const fetchDocument = async () => {
      try {
        const [docResponse, contentResponse] = await Promise.all([
          fetch(`/api/documents/${docId}`),
          fetch(`/api/documents/${docId}/content`),
        ]);

        if (!docResponse.ok) {
          throw new Error('Document not found');
        }

        const docData = await docResponse.json();
        const contentData = await contentResponse.json();

        setDocument(docData.document);
        setContent(contentData.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [user, docId]);

  const handleSave = useCallback(async (newContent: Record<string, unknown>) => {
    if (!user || !docId) return;
    
    setIsSaving(true);
    try {
      await fetch(`/api/documents/${docId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, userId: user.id }),
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, docId]);

  const handleAIAction = async (action: string) => {
    if (!user || !document) return;

    try {
      const response = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          documentId: docId,
          input: { content },
          aiConsent: document.aiConsent,
        }),
      });

      const data = await response.json();
      console.log('AI request queued:', data.requestId);
    } catch (err) {
      console.error('AI action failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="brutalist-border p-4 bg-[var(--surface)]">
          <p className="font-mono text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="brutalist-border p-8 bg-[var(--surface)] text-center">
          <p className="font-mono text-lg mb-4">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="brutalist-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <DocumentEditor
      document={document}
      content={content}
      onSave={handleSave}
      presences={presences}
      isSaving={isSaving}
      onAIAction={handleAIAction}
    />
  );
}
