import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  GitCompare,
  FileText,
  BarChart2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentStore } from '@/store/documents'

const stats = [
  { label: 'Documents Created', value: 0, icon: FileText },
  { label: 'Total Words', value: '0', icon: TrendingUp },
  { label: 'Avg Readability', value: 0, icon: BarChart2 },
  { label: 'Writing Session', value: 'Now', icon: Clock },
]

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { documents, loading, fetchDocuments, createDocument, deleteDocument, getCachedDocuments } = useDocumentStore()
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle')

  // Fetch documents on mount
  useEffect(() => {
    let isCancelled = false
    const cached = getCachedDocuments()
    setSyncStatus('syncing')

    fetchDocuments()
      .then(() => {
        if (isCancelled) return
        setSyncStatus('synced')
        window.setTimeout(() => {
          if (!isCancelled) setSyncStatus('idle')
        }, 1500)
      })
      .catch(() => {
        if (isCancelled) return
        setSyncStatus(cached.length > 0 ? 'offline' : 'offline')
      })

    return () => {
      isCancelled = true
    }
  }, [fetchDocuments, getCachedDocuments])

  const handleCreateDocument = async () => {
    setCreating(true)
    try {
      const doc = await createDocument(newDocTitle || 'Untitled Document')
      if (doc) {
        navigate(`/editor/${doc.id}`)
      }
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setCreating(false)
      setShowNewDocModal(false)
      setNewDocTitle('')
    }
  }

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId)
    }
  }

  return (
    <>
      {loading && documents.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
            <div>
              <h1 className="text-5xl md:text-7xl font-heading font-semibold tracking-tighter lowercase leading-none">
                good morning, <br /> writer.
              </h1>
              <p className="text-muted-foreground text-sm mt-4 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-primary/90 transition-transform hover:-translate-y-1 hover:shadow-sm"
            >
              <Plus className="h-5 w-5" /> Start Writing
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border p-5 shadow-sm hover:-translate-y-1 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-3">
                  <span className="text-foreground/70 text-xs uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-4xl md:text-5xl font-semibold tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/compare"
              className="group bg-secondary border border-border p-8 flex flex-col justify-between min-h-[160px] shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <GitCompare className="h-8 w-8" />
                <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">Compare Drafts</p>
                <p className="text-sm mt-1 opacity-80 uppercase">Side-by-side analysis</p>
              </div>
            </Link>

            <Link
              to="/style-profile"
              className="group bg-secondary border border-border p-8 flex flex-col justify-between min-h-[160px] shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <BarChart2 className="h-8 w-8" />
                <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">Style Profile</p>
                <p className="text-sm mt-1 opacity-80 uppercase">Your writing fingerprint</p>
              </div>
            </Link>
          </div>

          {/* Document List */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tighter uppercase">Recent Works</h2>
                {syncStatus !== 'idle' && (
                  <div className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[10px] uppercase tracking-wider">
                    {syncStatus === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {syncStatus === 'synced' && <CheckCircle2 className="h-3 w-3" />}
                    {syncStatus === 'offline' && <AlertCircle className="h-3 w-3" />}
                    {syncStatus === 'syncing' && 'Syncing...'}
                    {syncStatus === 'synced' && 'Synced'}
                    {syncStatus === 'offline' && 'Offline cache'}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowNewDocModal(true)}
                  className="rounded-full border border-border font-bold hover:bg-foreground hover:text-background"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Document
                </Button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/40 rounded-md bg-card/40">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-bold">No documents yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first document to get started</p>
                <Button onClick={() => setShowNewDocModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/editor/${doc.id}`}
                    className="group bg-card border border-border p-5 shadow-sm hover:-translate-y-1 hover:shadow-sm transition-all flex flex-col justify-between h-full relative"
                  >
                    <button
                      onClick={(e) => handleDeleteDocument(e, doc.id)}
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div>
                      <h3 className="font-bold text-lg leading-tight mb-3 group-hover:underline underline-offset-4 decoration-2 pr-6">{doc.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(doc.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/30 text-xs text-foreground/70">
                      <span>v{doc.version}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* New Document Modal */}
          {showNewDocModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border p-6 shadow-sm w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4 uppercase">New Document</h3>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Untitled Document"
                  className="w-full p-3 border border-border bg-background mb-4 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateDocument()
                    if (e.key === 'Escape') setShowNewDocModal(false)
                  }}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDocModal(false)}
                    className="flex-1 border border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDocument}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
