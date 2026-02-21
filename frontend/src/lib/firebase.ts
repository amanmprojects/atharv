import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_GOOGLE_CLOUD_PROJECT,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Log config for debugging
console.log('Firebase Config:', { ...firebaseConfig, apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT SET' })

const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null
let storage: FirebaseStorage | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0]
    } else {
      app = initializeApp(firebaseConfig)
      console.log('Firebase app initialized')
    }
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    if (useEmulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    }
    console.log('Firebase auth initialized')
  }
  return auth
}

export function getClientFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp())
    if (useEmulator) {
      connectFirestoreEmulator(firestore, 'localhost', 8080)
    }
    console.log('Firebase firestore initialized')
  }
  return firestore
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
    if (useEmulator) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
    console.log('Firebase storage initialized')
  }
  return storage
}

export { app, auth, firestore, storage }
