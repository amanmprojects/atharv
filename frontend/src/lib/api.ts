import axios from 'axios'
import type {
  AnalysisRequest, AnalysisResponse, Document,
  SEOAnalysisResponse, CompareResponse, AccessibilityResponse,
  KnowledgeGraphResponse, WatermarkEmbedResponse, WatermarkDetectResponse,
  StylometricSignature, AdminStats,
} from '@/types'
import type { Document as FirebaseDocument, AIRequest, AIFeature } from '@/types/firebase'

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim()
const normalizedApiBaseUrl = (() => {
  if (!rawApiBaseUrl) return '/api'
  const trimmed = rawApiBaseUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization']
}

// Core Analysis
export const analyzeText = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/analysis/analyze', request)
  return response.data
}

// Documents
export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<Document[]>('/documents/')
  return response.data
}

export const createDocument = async (doc: { title: string; content: string; genre: string }): Promise<Document> => {
  const response = await api.post<Document>('/documents/', doc)
  return response.data
}

export const getDocument = async (id: string): Promise<Document> => {
  const response = await api.get<Document>(`/documents/${id}`)
  return response.data
}

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`)
}

// Style Transform
export const transformStyle = async (data: {
  text: string; style_mode: string; intensity: number; preserve_entities: boolean
}): Promise<{ original_text: string; transformed_text: string; meaning_preservation_score: number; llm_call_used: boolean }> => {
  const response = await api.post('/analysis/transform', data)
  return response.data
}

export const getStyleArchetypes = async (): Promise<{ archetypes: Array<{ id: string; name: string; description: string }> }> => {
  const response = await api.get('/analysis/style-archetypes')
  return response.data
}

// SEO Analysis
export const analyzeSEO = async (text: string, targetKeywords: string[] = []): Promise<SEOAnalysisResponse> => {
  const response = await api.post<SEOAnalysisResponse>('/analysis/seo', { text, target_keywords: targetKeywords })
  return response.data
}

// Comparative Analysis
export const compareDocuments = async (textA: string, textB: string): Promise<CompareResponse> => {
  const response = await api.post<CompareResponse>('/analysis/compare', { text_a: textA, text_b: textB })
  return response.data
}

// Accessibility
export const analyzeAccessibility = async (text: string): Promise<AccessibilityResponse> => {
  const response = await api.post<AccessibilityResponse>('/analysis/accessibility', { text })
  return response.data
}

// Knowledge Graph
export const buildKnowledgeGraph = async (text: string): Promise<KnowledgeGraphResponse> => {
  const response = await api.post<KnowledgeGraphResponse>('/analysis/knowledge-graph', { text })
  return response.data
}

// Watermarking
export const embedWatermark = async (text: string, watermarkId?: string): Promise<WatermarkEmbedResponse> => {
  const response = await api.post<WatermarkEmbedResponse>('/analysis/watermark/embed', {
    text, watermark_id: watermarkId
  })
  return response.data
}

export const detectWatermark = async (text: string, originalText?: string): Promise<WatermarkDetectResponse> => {
  const response = await api.post<WatermarkDetectResponse>('/analysis/watermark/detect', {
    text, original_text: originalText
  })
  return response.data
}

export const getStylometricSignature = async (text: string): Promise<StylometricSignature> => {
  const response = await api.post<StylometricSignature>('/analysis/watermark/signature', { text })
  return response.data
}

// Admin Dashboard
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>('/analysis/admin/stats')
  return response.data
}

export const getAdminHistory = async (): Promise<{ history: Array<Record<string, unknown>>; total_count: number }> => {
  const response = await api.get('/analysis/admin/history')
  return response.data
}

export const trackSuggestionAction = async (suggestionId: string, status: 'accepted' | 'rejected'): Promise<void> => {
  await api.post('/analysis/admin/track-suggestion', { suggestion_id: suggestionId, status })
}

// Firebase Documents
export const getFirebaseDocuments = async (userId: string): Promise<FirebaseDocument[]> => {
  const response = await api.get<FirebaseDocument[]>('/firebase/documents/', {
    headers: { Authorization: `Bearer ${userId}` }
  })
  return response.data
}

export const createFirebaseDocument = async (userId: string, title: string): Promise<FirebaseDocument> => {
  const response = await api.post<FirebaseDocument>('/firebase/documents/', 
    { title, owner_id: userId },
    { headers: { Authorization: `Bearer ${userId}` } }
  )
  return response.data
}

export const getFirebaseDocument = async (userId: string, docId: string): Promise<FirebaseDocument> => {
  const response = await api.get<FirebaseDocument>(`/firebase/documents/${docId}`, {
    headers: { Authorization: `Bearer ${userId}` }
  })
  return response.data
}

export const getFirebaseDocumentContent = async (userId: string, docId: string): Promise<Record<string, unknown>> => {
  const response = await api.get<Record<string, unknown>>(`/firebase/documents/${docId}/content`, {
    headers: { Authorization: `Bearer ${userId}` }
  })
  return response.data
}

export const saveFirebaseDocumentContent = async (userId: string, docId: string, content: Record<string, unknown>): Promise<void> => {
  await api.put(`/firebase/documents/${docId}/content`, 
    { content },
    { headers: { Authorization: `Bearer ${userId}` } }
  )
}

export const deleteFirebaseDocument = async (userId: string, docId: string): Promise<void> => {
  await api.delete(`/firebase/documents/${docId}`, {
    headers: { Authorization: `Bearer ${userId}` }
  })
}

// AI Features
export const createAIRequest = async (
  userId: string,
  documentId: string,
  feature: AIFeature,
  input: Record<string, unknown>,
  aiConsent: boolean
): Promise<AIRequest> => {
  const response = await api.post<AIRequest>(`/ai/${feature}`, 
    { user_id: userId, document_id: documentId, feature, input, ai_consent: aiConsent },
    { headers: { Authorization: `Bearer ${userId}` } }
  )
  return response.data
}

export const getAIRequest = async (userId: string, feature: AIFeature, requestId: string): Promise<AIRequest> => {
  const response = await api.get<AIRequest>(`/ai/${feature}/${requestId}`, {
    headers: { Authorization: `Bearer ${userId}` }
  })
  return response.data
}

export default api
