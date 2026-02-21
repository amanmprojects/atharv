import { create } from 'zustand'
import type { Document, DocumentContent } from '@/types/firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || 'dev-user-123'
const CONTENT_CACHE_PREFIX = 'scriptiq:doc:content:'
const DOCUMENTS_CACHE_KEY = 'scriptiq:docs:list'
const STORAGE_SCHEMA_KEY = 'scriptiq:storage:schema'
const STORAGE_SCHEMA_VERSION = '2'

function getContentCacheKey(docId: string): string {
  return `${CONTENT_CACHE_PREFIX}${docId}`
}

function isDocumentContent(value: unknown): value is DocumentContent {
  if (!value || typeof value !== 'object') return false
  const content = value as { type?: unknown; content?: unknown }
  return content.type === 'doc' && Array.isArray(content.content)
}

function readCachedContent(docId: string): DocumentContent | null {
  try {
    const raw = localStorage.getItem(getContentCacheKey(docId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isDocumentContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCachedContent(docId: string, content: DocumentContent): void {
  try {
    localStorage.setItem(getContentCacheKey(docId), JSON.stringify(content))
  } catch {
    // Ignore localStorage quota/storage errors.
  }
}

function cleanupLegacyLocalStorage(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const currentSchema = localStorage.getItem(STORAGE_SCHEMA_KEY)
    const needsHardReset = currentSchema !== STORAGE_SCHEMA_VERSION

    const keysToDelete: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key) continue

      if (key.startsWith(CONTENT_CACHE_PREFIX)) {
        if (needsHardReset) {
          keysToDelete.push(key)
          continue
        }

        const raw = localStorage.getItem(key)
        if (!raw) {
          keysToDelete.push(key)
          continue
        }

        try {
          const parsed = JSON.parse(raw)
          if (!isDocumentContent(parsed)) {
            keysToDelete.push(key)
          }
        } catch {
          keysToDelete.push(key)
        }
      }
    }

    if (needsHardReset) {
      keysToDelete.push(DOCUMENTS_CACHE_KEY)
    }

    for (const key of keysToDelete) {
      localStorage.removeItem(key)
    }

    localStorage.setItem(STORAGE_SCHEMA_KEY, STORAGE_SCHEMA_VERSION)
  } catch {
    // Ignore localStorage access failures.
  }
}

cleanupLegacyLocalStorage()

function parseDocument(raw: Record<string, unknown>): Document | null {
  if (!raw.id || !raw.title || !raw.ownerId) return null
  return {
    id: String(raw.id),
    title: String(raw.title),
    ownerId: String(raw.ownerId),
    permissions: (raw.permissions as Record<string, 1 | 2 | 3 | 4>) || {},
    contentHash: String(raw.contentHash || ''),
    storagePath: String(raw.storagePath || ''),
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)) : new Date(),
    updatedAt: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
    version: Number(raw.version || 1),
    aiConsent: Boolean(raw.aiConsent),
    aiFeatures: Array.isArray(raw.aiFeatures) ? raw.aiFeatures.map(String) : [],
    isDeleted: Boolean(raw.isDeleted),
    deletedAt: raw.deletedAt ? new Date(String(raw.deletedAt)) : undefined,
  }
}

function readCachedDocuments(): Document[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const docs = parsed
      .map((doc) => parseDocument(doc as Record<string, unknown>))
      .filter((doc): doc is Document => Boolean(doc))
    docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    return docs
  } catch {
    return []
  }
}

function writeCachedDocuments(documents: Document[]): void {
  try {
    const serialized = documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deletedAt: doc.deletedAt?.toISOString(),
    }))
    localStorage.setItem(DOCUMENTS_CACHE_KEY, JSON.stringify(serialized))
  } catch {
    // Ignore localStorage quota/storage errors.
  }
}

interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  currentContent: DocumentContent | null
  loading: boolean
  saving: boolean
  error: string | null

  fetchDocuments: () => Promise<void>
  fetchDocument: (docId: string) => Promise<Document | null>
  createDocument: (title: string) => Promise<Document | null>
  updateDocument: (docId: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (docId: string) => Promise<void>
  saveContent: (docId: string, content: DocumentContent) => Promise<void>
  loadContent: (docId: string) => Promise<DocumentContent | null>
  getCachedDocuments: () => Document[]
  getCachedDocument: (docId: string) => Document | null
  getCachedContent: (docId: string) => DocumentContent | null
  cacheDocuments: (documents: Document[]) => void
  cacheContent: (docId: string, content: DocumentContent) => void
  setCurrentDocument: (doc: Document | null) => void
  clearError: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  currentContent: null,
  loading: false,
  saving: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/`,
        {
          headers: {
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        permissions: doc.permissions,
        contentHash: doc.contentHash || '',
        storagePath: doc.storagePath || '',
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        version: doc.version || 1,
        aiConsent: doc.aiConsent || false,
        aiFeatures: doc.aiFeatures || [],
        isDeleted: doc.isDeleted || false,
      }))

      documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      writeCachedDocuments(documents)
      set({ documents, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch documents', loading: false })
      console.error('Failed to fetch documents:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch documents')
    }
  },

  fetchDocument: async (docId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/${docId}`,
        {
          headers: {
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          set({ loading: false, error: 'Document not found' })
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const document: Document = {
        id: data.id,
        title: data.title,
        ownerId: data.ownerId,
        permissions: data.permissions,
        contentHash: data.contentHash || '',
        storagePath: data.storagePath || '',
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        version: data.version || 1,
        aiConsent: data.aiConsent || false,
        aiFeatures: data.aiFeatures || [],
        isDeleted: data.isDeleted || false,
      }

      set((state) => ({
        currentDocument: document,
        loading: false,
        documents: (() => {
          const existingIndex = state.documents.findIndex((d) => d.id === document.id)
          const next = existingIndex >= 0
            ? state.documents.map((d) => (d.id === document.id ? document : d))
            : [document, ...state.documents]
          writeCachedDocuments(next)
          return next
        })(),
      }))
      return document
    } catch (error) {
      set({ error: 'Failed to fetch document', loading: false })
      console.error('Failed to fetch document:', error)
      return null
    }
  },

  createDocument: async (title: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
          body: JSON.stringify({
            title: title || 'Untitled Document',
            owner_id: DEFAULT_USER_ID,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const newDoc: Document = {
        id: data.id,
        title: data.title,
        ownerId: data.ownerId,
        permissions: data.permissions,
        contentHash: data.contentHash || '',
        storagePath: data.storagePath,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        version: data.version || 1,
        aiConsent: data.aiConsent || false,
        aiFeatures: data.aiFeatures || [],
        isDeleted: data.isDeleted || false,
      }

      set((state) => ({
        documents: (() => {
          const next = [newDoc, ...state.documents]
          writeCachedDocuments(next)
          return next
        })(),
        currentDocument: newDoc,
        loading: false,
      }))

      return newDoc
    } catch (error) {
      set({ error: 'Failed to create document', loading: false })
      console.error('Failed to create document:', error)
      return null
    }
  },

  updateDocument: async (docId: string, updates: Partial<Document>) => {
    set({ saving: true, error: null })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/${docId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      set((state) => ({
        documents: (() => {
          const next = state.documents.map((d) =>
            d.id === docId ? { ...d, ...data } : d
          )
          writeCachedDocuments(next)
          return next
        })(),
        currentDocument: state.currentDocument?.id === docId
          ? { ...state.currentDocument, ...data }
          : state.currentDocument,
        saving: false,
      }))
    } catch (error) {
      set({ error: 'Failed to update document', saving: false })
      console.error('Failed to update document:', error)
    }
  },

  deleteDocument: async (docId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/${docId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      set((state) => ({
        documents: (() => {
          const next = state.documents.filter((d) => d.id !== docId)
          writeCachedDocuments(next)
          return next
        })(),
        currentDocument: state.currentDocument?.id === docId
          ? null
          : state.currentDocument,
        loading: false,
      }))
    } catch (error) {
      set({ error: 'Failed to delete document', loading: false })
      console.error('Failed to delete document:', error)
    }
  },

  saveContent: async (docId: string, content: DocumentContent) => {
    set({ saving: true, error: null })
    writeCachedContent(docId, content)
    set({ currentContent: content })
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/${docId}/content`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      set({ saving: false })
    } catch (error) {
      set({ error: 'Failed to save content', saving: false })
      console.error('Failed to save content:', error)
      throw error instanceof Error ? error : new Error('Failed to save content')
    }
  },

  loadContent: async (docId: string) => {
    const cachedContent = readCachedContent(docId)
    if (cachedContent) {
      set({ currentContent: cachedContent })
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/documents/${docId}/content`,
        {
          headers: {
            Authorization: `Bearer ${DEFAULT_USER_ID}`,
          },
        }
      )

      if (!response.ok) {
        if (cachedContent) {
          return cachedContent
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as DocumentContent
      if (!isDocumentContent(data)) {
        if (cachedContent) {
          return cachedContent
        }
        throw new Error('Invalid document content payload')
      }

      writeCachedContent(docId, data)
      set({ currentContent: data })
      return data
    } catch (error) {
      console.error('Failed to load content:', error)
      if (cachedContent) {
        return cachedContent
      }

      const defaultContent: DocumentContent = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }],
      }
      writeCachedContent(docId, defaultContent)
      set({ currentContent: defaultContent })
      return defaultContent
    }
  },

  getCachedContent: (docId: string) => {
    const cached = readCachedContent(docId)
    if (cached) {
      set({ currentContent: cached })
    }
    return cached
  },

  getCachedDocuments: () => {
    const cached = readCachedDocuments()
    if (cached.length > 0) {
      set({ documents: cached })
    }
    return cached
  },

  getCachedDocument: (docId: string) => {
    const cached = readCachedDocuments()
    const doc = cached.find((d) => d.id === docId) || null
    if (!doc) {
      return null
    }

    set((state) => ({
      currentDocument: doc,
      documents: state.documents.some((d) => d.id === doc.id)
        ? state.documents
        : [doc, ...state.documents],
    }))
    return doc
  },

  cacheDocuments: (documents: Document[]) => {
    writeCachedDocuments(documents)
    set({ documents })
  },

  cacheContent: (docId: string, content: DocumentContent) => {
    writeCachedContent(docId, content)
    set({ currentContent: content })
  },

  setCurrentDocument: (doc: Document | null) => {
    set({ currentDocument: doc })
  },

  clearError: () => {
    set({ error: null })
  },
}))
