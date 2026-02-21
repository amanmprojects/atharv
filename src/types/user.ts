export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  aiConsent: boolean;
  emailNotifications: boolean;
}

export interface UserPresence {
  userId: string;
  documentId: string;
  cursorPosition: {
    from: number;
    to: number;
  } | null;
  selection: {
    from: number;
    to: number;
  } | null;
  color: string;
  displayName: string;
  photoURL: string | null;
  lastActiveAt: Date;
  isTyping: boolean;
}

export interface UserUsage {
  userId: string;
  documentsCreated: number;
  storageUsed: number;
  aiTokensUsed: number;
  period: string;
  updatedAt: Date;
}

export const CURSOR_COLORS = [
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
];

export function assignCursorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}
