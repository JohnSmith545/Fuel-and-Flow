// Firebase mock for E2E testing.
// Initializes a real Firebase app with dummy config so that reference-creating
// functions (collection, doc, query) work without crashing. Network calls
// (getDocs, onSnapshot) will silently fail or remain pending — which is fine
// since E2E tests use mocked data, not Firestore.

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'fake-api-key',
  authDomain: 'fake.firebaseapp.com',
  projectId: 'fake-project',
  storageBucket: 'fake.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:fake',
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
export default app
