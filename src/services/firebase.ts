import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'controle-checklist.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'controle-checklist',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'controle-checklist.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:000000000000:web:demo',
}

export const firebaseApp: FirebaseApp = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig)

export const firestore = getFirestore(firebaseApp)
export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
