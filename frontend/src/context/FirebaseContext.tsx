import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import type { User } from '@/types/firebase'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    settings: {
      theme: 'system',
      fontSize: 'medium',
      aiConsent: false,
      emailNotifications: true,
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log('Auth state changed:', fbUser ? `User: ${fbUser.email}` : 'No user')
      setFirebaseUser(fbUser)
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser))
      } else {
        setUser(null)
      }
      setLoading(false)
      setError(null)
    }, (error) => {
      console.error('Auth error:', error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      
      // Add scopes for better access
      provider.addScope('email')
      provider.addScope('profile')
      
      console.log('GoogleAuthProvider configured, attempting to sign in...')
      
      // Use signInWithPopup which opens a new window
      const result = await signInWithPopup(auth, provider)
      console.log('Sign in successful!', result.user)
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      if (error.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked. Please allow popups for this site and try again.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.')
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled.')
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with a different sign-in method.')
      } else {
        setError(error.message || 'Failed to sign in. Please try again.')
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth)
      setUser(null)
      setFirebaseUser(null)
      setError(null)
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError(error.message || 'Failed to sign out')
    }
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
