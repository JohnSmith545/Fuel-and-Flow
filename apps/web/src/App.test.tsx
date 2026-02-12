import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

// Mock the AuthProvider to simulate a logged-in user or logged-out state
vi.mock('./providers/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock UserProfile to avoid loading state issues
vi.mock('./hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { onboardingCompleted: true, role: 'premium' },
    loading: false,
    updateProfile: vi.fn(),
  }),
}));

// Mock other providers/components to keep the test simple
vi.mock('./providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Check for the main dashboard heading specifically
    expect(screen.getByRole('heading', { name: /Dashboard/i, level: 1 })).toBeInTheDocument();
  });
});
