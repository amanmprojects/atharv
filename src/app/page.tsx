import Link from 'next/link';
import { listDocuments } from '@/actions/documentActions';
import CreateDocumentButton from '@/components/CreateDocumentButton';
import { FileText, Calendar } from 'lucide-react';

export default async function Home() {
  const documents = await listDocuments();

  return (
    <div className="min-h-screen p-8 md:p-16 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b-4 border-bd pb-6 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Docs Clone
          </h1>
          <p className="font-bold text-gray-600 mt-2">Neutral Brutalism Edition</p>
        </div>
        <CreateDocumentButton />
      </header>

      <main>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold bg-accent inline-block px-4 py-2 border-3 border-bd shadow-brutal text-white">
            Recent Documents
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="brutalist-card p-12 text-center bg-gray-50 flex flex-col items-center justify-center border-dashed">
            <div className="bg-white p-4 border-2 border-bd shadow-[2px_2px_0px_0px_var(--color-bd)] mb-4">
              <FileText size={48} className="text-gray-400" />
            </div>
            <p className="text-xl font-bold">No documents found.</p>
            <p className="text-gray-600 mt-2">Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {documents.map((doc) => (
              <Link href={`/document/${doc.id}`} key={doc.id} className="block group">
                <div className="brutalist-card h-full flex flex-col justify-between bg-[#fffaf0]">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white border-2 border-bd shadow-[2px_2px_0px_0px_var(--color-bd)] group-hover:bg-accent group-hover:text-white transition-colors">
                        <FileText size={28} />
                      </div>
                    </div>
                    <h3 className="font-black text-xl truncate mb-2" title={doc.title}>
                      {doc.title || 'Untitled Document'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mt-6 border-t-2 border-bd border-dashed pt-4">
                    <Calendar size={16} />
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
