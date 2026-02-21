'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDocument } from '@/actions/documentActions';
import { Plus } from 'lucide-react';

export default function CreateDocumentButton() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const handleCreate = async () => {
        setIsPending(true);
        try {
            const doc = await createDocument('Untitled Document');
            router.push(`/document/${doc.id}`);
        } catch (error) {
            console.error('Failed to create document', error);
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleCreate}
            disabled={isPending}
            className="brutalist-button"
        >
            <Plus size={20} />
            <span>{isPending ? 'Creating...' : 'New Document'}</span>
        </button>
    );
}
