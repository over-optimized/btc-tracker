import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { EnhancedAuthProvider } from '../../contexts/EnhancedAuthContext';
import NavBar from '../NavBar';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the original AuthContext
const mockAuth = {
  user: null,
  session: null,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  isAuthenticated: false,
  isAnonymous: true,
  supabase: null,
};

vi.mock('../../contexts/AuthContext', () => ({
  useOptionalAuth: () => mockAuth,
}));

// Mock useAuthHistory
const mockAuthHistory = {
  hasEverAuthenticated: false,
  lastAuthenticatedAt: null,
  userPreference: 'undecided' as const,
  deviceUsers: [],
  authenticationAttempts: 0,
  lastPreferenceUpdate: null,
  isIntentionallyAnonymous: false,
  hasAuthenticatedBefore: false,
  recommendsAuthentication: false,
  isMultiUserDevice: false,
  daysSinceLastAuth: null,
  updatePreference: vi.fn(),
  recordAuthenticationAttempt: vi.fn(),
  clearHistory: vi.fn(),
};

vi.mock('../../hooks/useAuthHistory', () => ({
  useAuthHistory: () => mockAuthHistory,
}));

// Mock environment variables
Object.assign(import.meta.env, {
  VITE_ENABLE_SUPABASE: 'true',
  VITE_ENABLE_AUTHENTICATION: 'true',
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
});

describe('NavBar', () => {
  it('renders navigation links', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EnhancedAuthProvider>
            <NavBar />
          </EnhancedAuthProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Charts/i)).toBeInTheDocument();
  });
});
