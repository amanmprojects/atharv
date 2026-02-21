export type PermissionLevel = 1 | 2 | 3 | 4

export const PERMISSIONS = {
  VIEWER: 1 as PermissionLevel,
  COMMENTER: 2 as PermissionLevel,
  EDITOR: 3 as PermissionLevel,
  OWNER: 4 as PermissionLevel,
}

export interface User {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Date
  lastLoginAt: Date
  settings?: UserSettings
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  aiConsent: boolean
  emailNotifications: boolean
}

export interface Document {
  id: string
  title: string
  ownerId: string
  permissions: Record<string, PermissionLevel>
  contentHash: string
  storagePath: string
  createdAt: Date
  updatedAt: Date
  version: number
  aiConsent: boolean
  aiFeatures: string[]
  isDeleted: boolean
  deletedAt?: Date
}

export interface DocumentContent {
  type: 'doc'
  content: Array<{
    type: string
    content?: Array<{
      type: string
      text?: string
      marks?: Array<{ type: string }>
      attrs?: Record<string, unknown>
    }>
    attrs?: Record<string, unknown>
  }>
}

export interface UserPresence {
  userId: string
  displayName: string
  photoURL: string | null
  color: string
  lastActive: Date
  cursorPosition?: {
    from: number
    to: number
  }
}

export type AIFeature =
  | 'summarize'
  | 'translate'
  | 'grammar-check'
  | 'tone-adjustment'
  | 'expand'
  | 'shorten'
  | 'generate-outline'
  | 'help-me-write'
  | 'improve'

export interface AIRequest {
  id: string
  userId: string
  documentId: string
  feature: AIFeature
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  tokensUsed?: number
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface ShareInvitation {
  id: string
  documentId: string
  inviterId: string
  inviteeEmail: string
  permissionLevel: PermissionLevel
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: Date
  expiresAt: Date
}

export function assignCursorColor(index: number): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ]
  return colors[index % colors.length]
}
