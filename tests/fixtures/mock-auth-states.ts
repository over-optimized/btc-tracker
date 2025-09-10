/**
 * Mock Auth States for Testing
 * Predefined authentication states for consistent testing
 */

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}

export interface MockSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: MockUser;
}

export interface MockAuthState {
  name: string;
  description: string;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  loading: boolean;
  user: MockUser | null;
  session: MockSession | null;
}

/**
 * Anonymous user state (not logged in)
 */
export const anonymousState: MockAuthState = {
  name: 'Anonymous',
  description: 'User is not authenticated, using localStorage',
  isAuthenticated: false,
  isAnonymous: true,
  loading: false,
  user: null,
  session: null,
};

/**
 * Loading auth state (initial page load)
 */
export const loadingState: MockAuthState = {
  name: 'Loading',
  description: 'Auth state is loading/initializing',
  isAuthenticated: false,
  isAnonymous: false,
  loading: true,
  user: null,
  session: null,
};

/**
 * Basic authenticated user
 */
export const authenticatedState: MockAuthState = {
  name: 'Authenticated',
  description: 'User is logged in with valid session',
  isAuthenticated: true,
  isAnonymous: false,
  loading: false,
  user: {
    id: 'auth-test-user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
  },
  session: {
    access_token: 'mock-access-token-123',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000, // 1 hour from now
    refresh_token: 'mock-refresh-token-123',
    user: {
      id: 'auth-test-user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      app_metadata: {},
      user_metadata: { full_name: 'Test User' },
    },
  },
};

/**
 * Migration test user (for testing localStorage → Supabase migration)
 */
export const migrationTestUser: MockAuthState = {
  name: 'Migration Test User',
  description: 'User account specifically for testing data migration',
  isAuthenticated: true,
  isAnonymous: false,
  loading: false,
  user: {
    id: 'migration-test-user-456',
    email: 'migration.test@example.com',
    created_at: '2024-01-15T10:00:00.000Z',
    app_metadata: {},
    user_metadata: {
      full_name: 'Migration Test User',
      test_scenario: 'localStorage_to_supabase',
    },
  },
  session: {
    access_token: 'migration-access-token-456',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: 'migration-refresh-token-456',
    user: {
      id: 'migration-test-user-456',
      email: 'migration.test@example.com',
      created_at: '2024-01-15T10:00:00.000Z',
      app_metadata: {},
      user_metadata: {
        full_name: 'Migration Test User',
        test_scenario: 'localStorage_to_supabase',
      },
    },
  },
};

/**
 * Expired session state
 */
export const expiredSessionState: MockAuthState = {
  name: 'Expired Session',
  description: 'User session has expired',
  isAuthenticated: false,
  isAnonymous: false,
  loading: false,
  user: null,
  session: {
    access_token: 'expired-access-token',
    token_type: 'bearer',
    expires_in: 0,
    expires_at: Date.now() - 3600000, // 1 hour ago (expired)
    refresh_token: 'expired-refresh-token',
    user: {
      id: 'expired-user-789',
      email: 'expired@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      app_metadata: {},
      user_metadata: {},
    },
  },
};

/**
 * New user state (just signed up)
 */
export const newUserState: MockAuthState = {
  name: 'New User',
  description: 'Newly registered user with no existing data',
  isAuthenticated: true,
  isAnonymous: false,
  loading: false,
  user: {
    id: 'new-user-101',
    email: 'newuser@example.com',
    created_at: new Date().toISOString(), // Just created
    app_metadata: {},
    user_metadata: {
      full_name: 'New User',
      onboarding_completed: false,
    },
  },
  session: {
    access_token: 'new-user-access-token-101',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: 'new-user-refresh-token-101',
    user: {
      id: 'new-user-101',
      email: 'newuser@example.com',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {
        full_name: 'New User',
        onboarding_completed: false,
      },
    },
  },
};

/**
 * Existing user state (returning user with data)
 */
export const existingUserState: MockAuthState = {
  name: 'Existing User',
  description: 'Returning user with existing Supabase data',
  isAuthenticated: true,
  isAnonymous: false,
  loading: false,
  user: {
    id: 'existing-user-202',
    email: 'existing@example.com',
    created_at: '2023-06-01T00:00:00.000Z', // Older account
    app_metadata: {},
    user_metadata: {
      full_name: 'Existing User',
      onboarding_completed: true,
      last_login: new Date().toISOString(),
    },
  },
  session: {
    access_token: 'existing-user-access-token-202',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: 'existing-user-refresh-token-202',
    user: {
      id: 'existing-user-202',
      email: 'existing@example.com',
      created_at: '2023-06-01T00:00:00.000Z',
      app_metadata: {},
      user_metadata: {
        full_name: 'Existing User',
        onboarding_completed: true,
        last_login: new Date().toISOString(),
      },
    },
  },
};

/**
 * All available auth states
 */
export const mockAuthStates = {
  anonymous: anonymousState,
  loading: loadingState,
  authenticated: authenticatedState,
  migrationTest: migrationTestUser,
  expiredSession: expiredSessionState,
  newUser: newUserState,
  existingUser: existingUserState,
} as const;

/**
 * Auth state transition scenarios
 */
export interface AuthStateTransition {
  name: string;
  description: string;
  from: MockAuthState;
  to: MockAuthState;
  triggerEvent: string;
}

export const authTransitions: AuthStateTransition[] = [
  {
    name: 'Anonymous to Authenticated',
    description: 'User signs up or logs in from anonymous state',
    from: anonymousState,
    to: authenticatedState,
    triggerEvent: 'sign-up',
  },
  {
    name: 'Loading to Anonymous',
    description: 'Initial load completes with no auth',
    from: loadingState,
    to: anonymousState,
    triggerEvent: 'auth-loaded',
  },
  {
    name: 'Loading to Authenticated',
    description: 'Initial load completes with existing session',
    from: loadingState,
    to: authenticatedState,
    triggerEvent: 'session-restored',
  },
  {
    name: 'Authenticated to Anonymous',
    description: 'User logs out',
    from: authenticatedState,
    to: anonymousState,
    triggerEvent: 'logout',
  },
  {
    name: 'Expired Session to Anonymous',
    description: 'Session expires and refresh fails',
    from: expiredSessionState,
    to: anonymousState,
    triggerEvent: 'session-expired',
  },
  {
    name: 'Migration Scenario',
    description: 'Anonymous user with data becomes authenticated',
    from: anonymousState,
    to: migrationTestUser,
    triggerEvent: 'migration-signup',
  },
];

/**
 * Helper to create localStorage data for auth state
 */
export function createAuthLocalStorage(authState: MockAuthState): Record<string, string> {
  if (!authState.isAuthenticated || !authState.session) {
    return {}; // No auth data in localStorage
  }

  return {
    'supabase.auth.token': JSON.stringify(authState.session),
    'supabase.auth.expires_at': authState.session.expires_at.toString(),
    'supabase.auth.refresh_token': authState.session.refresh_token,
  };
}

/**
 * Helper to get user ID for auth state (null if anonymous)
 */
export function getUserId(authState: MockAuthState): string | null {
  return authState.user?.id || null;
}

/**
 * Helper to check if auth state represents a valid session
 */
export function isValidSession(authState: MockAuthState): boolean {
  return (
    authState.isAuthenticated &&
    authState.session !== null &&
    authState.session.expires_at > Date.now()
  );
}

/**
 * Create a custom auth state for testing
 */
export function createCustomAuthState(
  userId: string,
  email: string,
  options: {
    isAuthenticated?: boolean;
    expiresInMs?: number;
    metadata?: Record<string, any>;
  } = {},
): MockAuthState {
  const {
    isAuthenticated = true,
    expiresInMs = 3600000, // 1 hour
    metadata = {},
  } = options;

  if (!isAuthenticated) {
    return {
      name: 'Custom Anonymous',
      description: 'Custom anonymous state',
      isAuthenticated: false,
      isAnonymous: true,
      loading: false,
      user: null,
      session: null,
    };
  }

  const user: MockUser = {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: metadata,
  };

  return {
    name: 'Custom Authenticated',
    description: 'Custom authenticated state',
    isAuthenticated: true,
    isAnonymous: false,
    loading: false,
    user,
    session: {
      access_token: `custom-token-${userId}`,
      token_type: 'bearer',
      expires_in: Math.floor(expiresInMs / 1000),
      expires_at: Date.now() + expiresInMs,
      refresh_token: `custom-refresh-${userId}`,
      user,
    },
  };
}
