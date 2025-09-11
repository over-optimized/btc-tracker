import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthHistory } from '../useAuthHistory';

// Mock the AuthContext
const mockAuth = {
  isAuthenticated: false,
  user: null,
  loading: false,
};

vi.mock('../../contexts/AuthContext', () => ({
  useOptionalAuth: () => mockAuth,
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAuthHistory', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockAuth.isAuthenticated = false;
    mockAuth.user = null;
    mockAuth.loading = false;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values when no stored data', () => {
      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.hasEverAuthenticated).toBe(false);
      expect(result.current.lastAuthenticatedAt).toBe(null);
      expect(result.current.userPreference).toBe('undecided');
      expect(result.current.deviceUsers).toEqual([]);
      expect(result.current.authenticationAttempts).toBe(0);
      expect(result.current.lastPreferenceUpdate).toBe(null);
    });

    it('should load existing auth history from localStorage', () => {
      const existingHistory = {
        hasEverAuthenticated: true,
        lastAuthenticatedAt: '2025-01-10T10:00:00.000Z',
        userPreference: 'authenticated',
        deviceUsers: ['user-123'],
        authenticationAttempts: 2,
        lastPreferenceUpdate: '2025-01-09T10:00:00.000Z',
      };

      mockLocalStorage.setItem('btc-tracker:auth-history', JSON.stringify(existingHistory));

      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.hasEverAuthenticated).toBe(true);
      expect(result.current.lastAuthenticatedAt).toEqual(new Date('2025-01-10T10:00:00.000Z'));
      expect(result.current.userPreference).toBe('authenticated');
      expect(result.current.deviceUsers).toEqual(['user-123']);
      expect(result.current.authenticationAttempts).toBe(2);
      expect(result.current.lastPreferenceUpdate).toEqual(new Date('2025-01-09T10:00:00.000Z'));
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.setItem('btc-tracker:auth-history', 'invalid-json');

      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.hasEverAuthenticated).toBe(false);
      expect(result.current.userPreference).toBe('undecided');
    });
  });

  describe('computed properties', () => {
    it('should compute isIntentionallyAnonymous correctly', () => {
      const { result } = renderHook(() => useAuthHistory());

      // Default state
      expect(result.current.isIntentionallyAnonymous).toBe(false);

      // After setting anonymous preference
      act(() => {
        result.current.updatePreference('anonymous');
      });

      expect(result.current.isIntentionallyAnonymous).toBe(true);
    });

    it('should compute hasAuthenticatedBefore correctly', () => {
      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.hasAuthenticatedBefore).toBe(false);

      // Simulate authentication
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: 'user-123', email: 'test@example.com' } as any;

      const { result: newResult } = renderHook(() => useAuthHistory());
      expect(newResult.current.hasAuthenticatedBefore).toBe(true);
    });

    it('should compute recommendsAuthentication correctly for different scenarios', () => {
      const { result } = renderHook(() => useAuthHistory());

      // New user - should not recommend
      expect(result.current.recommendsAuthentication).toBe(false);

      // User attempts authentication
      act(() => {
        result.current.recordAuthenticationAttempt();
      });
      expect(result.current.recommendsAuthentication).toBe(true);

      // User chooses anonymous mode - should not recommend
      act(() => {
        result.current.updatePreference('anonymous');
      });
      expect(result.current.recommendsAuthentication).toBe(false);
    });

    it('should compute daysSinceLastAuth correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      mockLocalStorage.setItem(
        'btc-tracker:auth-history',
        JSON.stringify({
          hasEverAuthenticated: true,
          lastAuthenticatedAt: threeDaysAgo.toISOString(),
          userPreference: 'authenticated',
          deviceUsers: ['user-123'],
          authenticationAttempts: 1,
        }),
      );

      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.daysSinceLastAuth).toBe(3);
    });

    it('should detect multi-user device', () => {
      mockLocalStorage.setItem(
        'btc-tracker:auth-history',
        JSON.stringify({
          hasEverAuthenticated: true,
          lastAuthenticatedAt: new Date().toISOString(),
          userPreference: 'authenticated',
          deviceUsers: ['user-123', 'user-456'],
          authenticationAttempts: 1,
        }),
      );

      const { result } = renderHook(() => useAuthHistory());

      expect(result.current.isMultiUserDevice).toBe(true);
    });
  });

  describe('actions', () => {
    it('should update preference and save to localStorage', () => {
      const { result } = renderHook(() => useAuthHistory());

      act(() => {
        result.current.updatePreference('anonymous');
      });

      expect(result.current.userPreference).toBe('anonymous');
      expect(result.current.lastPreferenceUpdate).toBeInstanceOf(Date);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'btc-tracker:auth-history',
        expect.stringContaining('"userPreference":"anonymous"'),
      );
    });

    it('should record authentication attempt', () => {
      const { result } = renderHook(() => useAuthHistory());

      act(() => {
        result.current.recordAuthenticationAttempt();
      });

      expect(result.current.authenticationAttempts).toBe(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      act(() => {
        result.current.recordAuthenticationAttempt();
      });

      expect(result.current.authenticationAttempts).toBe(2);
    });

    it('should clear history', () => {
      // Set up some history first
      const { result: setupResult } = renderHook(() => useAuthHistory());

      act(() => {
        setupResult.current.updatePreference('authenticated');
        setupResult.current.recordAuthenticationAttempt();
      });

      const { result } = renderHook(() => useAuthHistory());

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.hasEverAuthenticated).toBe(false);
      expect(result.current.lastAuthenticatedAt).toBe(null);
      expect(result.current.userPreference).toBe('undecided');
      expect(result.current.deviceUsers).toEqual([]);
      expect(result.current.authenticationAttempts).toBe(0);
      expect(result.current.lastPreferenceUpdate).toBe(null);
    });
  });

  describe('authentication tracking', () => {
    it('should track new user authentication', () => {
      const { result } = renderHook(() => useAuthHistory());

      // Simulate user authentication
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: 'user-123', email: 'test@example.com' } as any;

      // Re-render to trigger useEffect
      const { result: newResult } = renderHook(() => useAuthHistory());

      expect(newResult.current.hasEverAuthenticated).toBe(true);
      expect(newResult.current.lastAuthenticatedAt).toBeInstanceOf(Date);
      expect(newResult.current.deviceUsers).toEqual(['user-123']);
    });

    it('should handle multiple users on same device', () => {
      // First user
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: 'user-123' } as any;
      const { result: firstResult } = renderHook(() => useAuthHistory());
      expect(firstResult.current.deviceUsers).toContain('user-123');

      // Second user (simulate different user authentication)
      mockAuth.user = { id: 'user-456' } as any;
      const { result: secondResult } = renderHook(() => useAuthHistory());

      // Should contain both users
      expect(secondResult.current.deviceUsers).toContain('user-123');
      expect(secondResult.current.deviceUsers).toContain('user-456');
      expect(secondResult.current.isMultiUserDevice).toBe(true);
    });

    it('should not duplicate users in deviceUsers array', () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: 'user-123' } as any;

      const { result: firstResult } = renderHook(() => useAuthHistory());
      expect(firstResult.current.deviceUsers).toEqual(['user-123']);

      // Same user authenticates again
      const { result: secondResult } = renderHook(() => useAuthHistory());
      expect(secondResult.current.deviceUsers).toEqual(['user-123']);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useAuthHistory());

      // Should not throw, but log error
      expect(() => {
        act(() => {
          result.current.updatePreference('authenticated');
        });
      }).not.toThrow();
    });
  });
});
