import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedAuthProvider, useEnhancedAuth } from '../EnhancedAuthContext';

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

vi.mock('../AuthContext', () => ({
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
const originalEnv = import.meta.env;

describe('EnhancedAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    Object.assign(import.meta.env, originalEnv, {
      VITE_ENABLE_SUPABASE: 'true',
      VITE_ENABLE_AUTHENTICATION: 'true',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
    });

    // Reset mock auth
    Object.assign(mockAuth, {
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
      isAnonymous: true,
      supabase: { auth: {} }, // Mock Supabase client
    });

    // Reset mock auth history
    Object.assign(mockAuthHistory, {
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
    });
  });

  describe('authCapability detection', () => {
    it('should detect disabled auth when supabase is null', () => {
      mockAuth.supabase = null;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return <div data-testid="auth-capability">{auth.authCapability}</div>;
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-capability')).toHaveTextContent('disabled');
    });

    it('should detect disabled auth when environment variables are missing', () => {
      import.meta.env.VITE_ENABLE_SUPABASE = 'false';

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return <div data-testid="auth-capability">{auth.authCapability}</div>;
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-capability')).toHaveTextContent('disabled');
    });

    it('should detect disabled auth when credentials are missing', () => {
      delete import.meta.env.VITE_SUPABASE_URL;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return <div data-testid="auth-capability">{auth.authCapability}</div>;
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-capability')).toHaveTextContent('disabled');
    });

    it('should detect available auth when properly configured', () => {
      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return <div data-testid="auth-capability">{auth.authCapability}</div>;
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-capability')).toHaveTextContent('available');
    });
  });

  describe('context integration', () => {
    it('should provide all original auth context properties', () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: 'user-123', email: 'test@example.com' } as any;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return (
          <div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="user-email">{auth.user?.email || 'null'}</div>
            <div data-testid="loading">{auth.loading.toString()}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(getByTestId('loading')).toHaveTextContent('false');
    });

    it('should provide enhanced authentication properties', () => {
      mockAuthHistory.hasAuthenticatedBefore = true;
      mockAuthHistory.isIntentionallyAnonymous = false;
      mockAuthHistory.recommendsAuthentication = true;
      mockAuthHistory.isMultiUserDevice = true;
      mockAuthHistory.daysSinceLastAuth = 5;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return (
          <div>
            <div data-testid="has-authenticated-before">
              {auth.hasAuthenticatedBefore.toString()}
            </div>
            <div data-testid="is-intentionally-anonymous">
              {auth.isIntentionallyAnonymous.toString()}
            </div>
            <div data-testid="recommends-authentication">
              {auth.recommendsAuthentication.toString()}
            </div>
            <div data-testid="is-multi-user-device">{auth.isMultiUserDevice.toString()}</div>
            <div data-testid="days-since-last-auth">{auth.daysSinceLastAuth}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('has-authenticated-before')).toHaveTextContent('true');
      expect(getByTestId('is-intentionally-anonymous')).toHaveTextContent('false');
      expect(getByTestId('recommends-authentication')).toHaveTextContent('true');
      expect(getByTestId('is-multi-user-device')).toHaveTextContent('true');
      expect(getByTestId('days-since-last-auth')).toHaveTextContent('5');
    });

    it('should provide auth history action methods', () => {
      const TestComponent = () => {
        const auth = useEnhancedAuth();

        React.useEffect(() => {
          auth.updateAuthPreference('anonymous');
          auth.recordAuthenticationAttempt();
        }, [auth]);

        return <div data-testid="test-component">Test</div>;
      };

      render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(mockAuthHistory.updatePreference).toHaveBeenCalledWith('anonymous');
      expect(mockAuthHistory.recordAuthenticationAttempt).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return <div>{auth.authCapability}</div>;
      };

      // Expect error when not wrapped in provider
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useEnhancedAuth must be used within an EnhancedAuthProvider');
    });
  });

  describe('authentication states', () => {
    it('should handle authenticated user state', () => {
      mockAuth.isAuthenticated = true;
      mockAuth.isAnonymous = false;
      mockAuth.user = { id: 'user-123', email: 'test@example.com' } as any;
      mockAuth.session = { access_token: 'token' } as any;

      mockAuthHistory.hasAuthenticatedBefore = true;
      mockAuthHistory.isIntentionallyAnonymous = false;
      mockAuthHistory.recommendsAuthentication = false;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return (
          <div>
            <div data-testid="auth-state">
              {auth.isAuthenticated ? 'authenticated' : 'anonymous'}
            </div>
            <div data-testid="user-id">{auth.user?.id}</div>
            <div data-testid="capability">{auth.authCapability}</div>
            <div data-testid="has-auth-before">{auth.hasAuthenticatedBefore.toString()}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(getByTestId('user-id')).toHaveTextContent('user-123');
      expect(getByTestId('capability')).toHaveTextContent('available');
      expect(getByTestId('has-auth-before')).toHaveTextContent('true');
    });

    it('should handle anonymous user state with history', () => {
      mockAuth.isAuthenticated = false;
      mockAuth.isAnonymous = true;
      mockAuth.user = null;

      mockAuthHistory.hasAuthenticatedBefore = true;
      mockAuthHistory.isIntentionallyAnonymous = false;
      mockAuthHistory.recommendsAuthentication = true;
      mockAuthHistory.daysSinceLastAuth = 3;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return (
          <div>
            <div data-testid="auth-state">
              {auth.isAuthenticated ? 'authenticated' : 'anonymous'}
            </div>
            <div data-testid="recommends-auth">{auth.recommendsAuthentication.toString()}</div>
            <div data-testid="days-since">{auth.daysSinceLastAuth}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('auth-state')).toHaveTextContent('anonymous');
      expect(getByTestId('recommends-auth')).toHaveTextContent('true');
      expect(getByTestId('days-since')).toHaveTextContent('3');
    });

    it('should handle intentionally anonymous state', () => {
      mockAuthHistory.isIntentionallyAnonymous = true;
      mockAuthHistory.userPreference = 'anonymous';
      mockAuthHistory.recommendsAuthentication = false;

      const TestComponent = () => {
        const auth = useEnhancedAuth();
        return (
          <div>
            <div data-testid="intentionally-anonymous">
              {auth.isIntentionallyAnonymous.toString()}
            </div>
            <div data-testid="recommends-auth">{auth.recommendsAuthentication.toString()}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <EnhancedAuthProvider>
          <TestComponent />
        </EnhancedAuthProvider>,
      );

      expect(getByTestId('intentionally-anonymous')).toHaveTextContent('true');
      expect(getByTestId('recommends-auth')).toHaveTextContent('false');
    });
  });
});
