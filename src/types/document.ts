export type PermissionLevel = 1 | 2 | 3 | 4;

export const PERMISSIONS = {
  VIEWER: 1 as PermissionLevel,
  COMMENTER: 2 as PermissionLevel,
  EDITOR: 3 as PermissionLevel,
  OWNER: 4 as PermissionLevel,
};

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  permissions: Record<string, PermissionLevel>;
  contentHash: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  aiConsent: boolean;
  aiFeatures: string[];
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface DocumentContent {
  type: 'doc';
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string }>;
      attrs?: Record<string, unknown>;
    }>;
    attrs?: Record<string, unknown>;
  }>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  contentHash: string;
  storagePath: string;
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
}

export interface Comment {
  id: string;
  documentId: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  position: {
    from: number;
    to: number;
  };
  replies: CommentReply[];
  mentions: string[];
}

export interface CommentReply {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  mentions: string[];
}

export interface ShareInvitation {
  id: string;
  documentId: string;
  inviterId: string;
  inviteeEmail: string;
  permissionLevel: PermissionLevel;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: number;
}
