'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: null,
  createdAt: new Date(),
  lastLoginAt: new Date(),
  settings: {
    theme: 'light',
    fontSize: 'medium',
    aiConsent: false,
    emailNotifications: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(mockUser);
  const [loading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
