### 1. Initialize Firebase (`apps/web/src/lib/firebase.ts`)

```typescript
// apps/web/src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Services
export const auth = getAuth(app)
export const db = getFirestore(app) // Exporting DB for the AuthProvider
export const googleProvider = new GoogleAuthProvider()

export default app
```

---

### 2. Create the User Context (`apps/web/src/providers/AuthProvider.tsx`)

```typescript
// apps/web/src/providers/AuthProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // [LOGIC UPDATE]: Create User Profile on Login
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1. Check if user document exists
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);

      // 2. If new user, create their profile
      if (!userSnapshot.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          onboardingCompleted: false
        });
      } else {
        // 3. If returning user, just update last login
        await setDoc(userDocRef, {
            lastLogin: serverTimestamp()
        }, { merge: true });
      }

    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
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

```

---

### 3. Usage Example (`apps/web/src/App.tsx`)

```typescript
// apps/web/src/App.tsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import './styles.css';

function FuelAndFlowApp() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // VIEW 1: LOGGED OUT (Landing Page)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <nav className="w-full px-8 py-6 max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter text-blue-600">
            Fuel<span className="text-slate-900">&</span>Flow
          </div>
          <button
            onClick={signInWithGoogle}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            Login with Google
          </button>
        </nav>

        <main className="flex-grow max-w-5xl mx-auto mt-20 px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-8 text-slate-900">
            Optimize your energy.<br />Own your day.
          </h1>
          <button
            onClick={signInWithGoogle}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition"
          >
            Start Tracking Now
          </button>
        </main>
      </div>
    );
  }

  // VIEW 2: LOGGED IN (Dashboard Skeleton)
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-slate-900">Dashboard</div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-600">
              Welcome, {user.displayName}
            </span>
            <button
              onClick={logout}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Today's Fuel</h2>
          <p className="text-slate-500">No meals logged yet.</p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FuelAndFlowApp />
    </AuthProvider>
  );
}

```

**Would you like to implement the `AuthProvider` update now?**
