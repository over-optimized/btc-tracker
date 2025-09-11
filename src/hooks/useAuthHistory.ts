import { useCallback, useEffect, useState } from 'react';
import { useOptionalAuth } from '../contexts/AuthContext';

interface AuthHistoryData {
  hasEverAuthenticated: boolean;
  lastAuthenticatedAt: Date | null;
  userPreference: 'anonymous' | 'authenticated' | 'undecided';
  deviceUsers: string[]; // Array of user IDs who have used this device
  authenticationAttempts: number;
  lastPreferenceUpdate: Date | null;
}

interface AuthHistoryResult extends AuthHistoryData {
  // Computed properties
  isIntentionallyAnonymous: boolean;
  hasAuthenticatedBefore: boolean;
  recommendsAuthentication: boolean;
  isMultiUserDevice: boolean;
  daysSinceLastAuth: number | null;

  // Actions
  updatePreference: (preference: AuthHistoryData['userPreference']) => void;
  recordAuthenticationAttempt: () => void;
  clearHistory: () => void;
}

const AUTH_HISTORY_KEY = 'btc-tracker:auth-history';

/**
 * Hook to track and manage user authentication history and preferences
 * Provides context-aware authentication states for personalized UX
 */
export const useAuthHistory = (): AuthHistoryResult => {
  const auth = useOptionalAuth();

  const [authHistory, setAuthHistory] = useState<AuthHistoryData>(() => {
    try {
      const stored = localStorage.getItem(AUTH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          hasEverAuthenticated: parsed.hasEverAuthenticated || false,
          lastAuthenticatedAt: parsed.lastAuthenticatedAt
            ? new Date(parsed.lastAuthenticatedAt)
            : null,
          userPreference: parsed.userPreference || 'undecided',
          deviceUsers: Array.isArray(parsed.deviceUsers) ? parsed.deviceUsers : [],
          authenticationAttempts: parsed.authenticationAttempts || 0,
          lastPreferenceUpdate: parsed.lastPreferenceUpdate
            ? new Date(parsed.lastPreferenceUpdate)
            : null,
        };
      }
    } catch (error) {
      console.warn('Failed to load auth history:', error);
    }

    return {
      hasEverAuthenticated: false,
      lastAuthenticatedAt: null,
      userPreference: 'undecided',
      deviceUsers: [],
      authenticationAttempts: 0,
      lastPreferenceUpdate: null,
    };
  });

  // Save to localStorage whenever authHistory changes
  const saveAuthHistory = useCallback((newHistory: AuthHistoryData) => {
    try {
      localStorage.setItem(AUTH_HISTORY_KEY, JSON.stringify(newHistory));
      setAuthHistory(newHistory);
    } catch (error) {
      console.error('Failed to save auth history:', error);
    }
  }, []);

  // Update authentication history when user authenticates
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const userId = auth.user.id;
      const now = new Date();

      setAuthHistory((prev) => {
        const newHistory = {
          ...prev,
          hasEverAuthenticated: true,
          lastAuthenticatedAt: now,
          deviceUsers: prev.deviceUsers.includes(userId)
            ? prev.deviceUsers
            : [...prev.deviceUsers, userId],
        };

        // Save immediately when user authenticates
        try {
          localStorage.setItem(AUTH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
          console.error('Failed to save auth history on authentication:', error);
        }

        return newHistory;
      });
    }
  }, [auth.isAuthenticated, auth.user]);

  // Computed properties
  const isIntentionallyAnonymous = authHistory.userPreference === 'anonymous';
  const hasAuthenticatedBefore = authHistory.hasEverAuthenticated;
  const isMultiUserDevice = authHistory.deviceUsers.length > 1;

  const daysSinceLastAuth = authHistory.lastAuthenticatedAt
    ? Math.floor((Date.now() - authHistory.lastAuthenticatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Recommendation logic: suggest authentication if user has data but hasn't authenticated
  const recommendsAuthentication = (() => {
    // Don't recommend if user intentionally chose anonymous mode
    if (isIntentionallyAnonymous) return false;

    // Don't recommend if currently authenticated
    if (auth.isAuthenticated) return false;

    // Don't recommend if user has never tried (let them discover organically)
    if (authHistory.userPreference === 'undecided' && authHistory.authenticationAttempts === 0) {
      return false;
    }

    // Recommend if user has authenticated before but is currently offline
    if (hasAuthenticatedBefore && !auth.isAuthenticated) return true;

    // Recommend if user has attempted authentication (shows interest)
    if (authHistory.authenticationAttempts > 0 && !auth.isAuthenticated) return true;

    return false;
  })();

  // Actions
  const updatePreference = useCallback(
    (preference: AuthHistoryData['userPreference']) => {
      const newHistory = {
        ...authHistory,
        userPreference: preference,
        lastPreferenceUpdate: new Date(),
      };
      saveAuthHistory(newHistory);
    },
    [authHistory, saveAuthHistory],
  );

  const recordAuthenticationAttempt = useCallback(() => {
    const newHistory = {
      ...authHistory,
      authenticationAttempts: authHistory.authenticationAttempts + 1,
    };
    saveAuthHistory(newHistory);
  }, [authHistory, saveAuthHistory]);

  const clearHistory = useCallback(() => {
    const clearedHistory: AuthHistoryData = {
      hasEverAuthenticated: false,
      lastAuthenticatedAt: null,
      userPreference: 'undecided',
      deviceUsers: [],
      authenticationAttempts: 0,
      lastPreferenceUpdate: null,
    };
    saveAuthHistory(clearedHistory);
  }, [saveAuthHistory]);

  return {
    ...authHistory,
    isIntentionallyAnonymous,
    hasAuthenticatedBefore,
    recommendsAuthentication,
    isMultiUserDevice,
    daysSinceLastAuth,
    updatePreference,
    recordAuthenticationAttempt,
    clearHistory,
  };
};
