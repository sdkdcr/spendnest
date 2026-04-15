import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'

interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function getEnvValue(key: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim() : ''
}

const firebaseConfig: FirebaseWebConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvValue('VITE_FIREBASE_APP_ID'),
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value.length > 0,
)

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* environment variables.')
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}
