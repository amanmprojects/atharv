import { notFound } from 'next/navigation';
import { getDocument } from '@/actions/documentActions';
import Editor from '@/components/Editor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
        notFound();
    }

    return (
        <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row md:items-center gap-6 mb-8 border-b-4 border-bd pb-6">
                <Link href="/" className="brutalist-button-outline w-fit">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight truncate w-full" title={document.title}>
                        {document.title || 'Untitled Document'}
                    </h1>
                    <p className="text-sm font-bold text-gray-500 mt-2 bg-gray-100 inline-block px-2 py-1 border-2 border-bd shadow-[1px_1px_0px_0px_var(--color-bd)]">
                        Created: {new Date(document.createdAt).toLocaleString()}
                    </p>
                </div>
            </header>

            <main className="flex-1 w-full">
                <Editor initialDocument={document} />
            </main>
        </div>
    );
}
