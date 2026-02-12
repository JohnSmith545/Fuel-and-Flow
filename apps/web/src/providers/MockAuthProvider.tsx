import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Mock user for E2E
  const [user] = useState({
    uid: 'e2e-test-user',
    email: 'test@example.com',
    displayName: 'Test User'
  });

  const value = {
    user,
    loading: false,
    signInWithGoogle: async () => {},
    loginWithEmail: async () => {},
    registerWithEmail: async () => {},
    logout: async () => {}
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
