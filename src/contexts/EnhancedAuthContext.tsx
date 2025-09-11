import React, { createContext, useContext } from 'react';
import { useOptionalAuth } from './AuthContext';
import { useAuthHistory } from '../hooks/useAuthHistory';

interface EnhancedAuthContextType {
  // All original auth context properties
  user: ReturnType<typeof useOptionalAuth>['user'];
  session: ReturnType<typeof useOptionalAuth>['session'];
  loading: ReturnType<typeof useOptionalAuth>['loading'];
  signUp: ReturnType<typeof useOptionalAuth>['signUp'];
  signIn: ReturnType<typeof useOptionalAuth>['signIn'];
  signOut: ReturnType<typeof useOptionalAuth>['signOut'];
  isAuthenticated: ReturnType<typeof useOptionalAuth>['isAuthenticated'];
  isAnonymous: ReturnType<typeof useOptionalAuth>['isAnonymous'];
  supabase: ReturnType<typeof useOptionalAuth>['supabase'];

  // Enhanced authentication capabilities and context
  authCapability: 'available' | 'disabled' | 'configured';
  hasAuthenticatedBefore: boolean;
  isIntentionallyAnonymous: boolean;
  recommendsAuthentication: boolean;
  isMultiUserDevice: boolean;
  daysSinceLastAuth: number | null;

  // Auth history actions
  updateAuthPreference: (preference: 'anonymous' | 'authenticated' | 'undecided') => void;
  recordAuthenticationAttempt: () => void;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

interface EnhancedAuthProviderProps {
  children: React.ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  const auth = useOptionalAuth();
  const authHistory = useAuthHistory();

  // Determine authentication capability
  const authCapability = (() => {
    if (!auth.supabase) return 'disabled';

    const supabaseEnabled = import.meta.env.VITE_ENABLE_SUPABASE === 'true';
    const authEnabled = import.meta.env.VITE_ENABLE_AUTHENTICATION === 'true';

    if (!supabaseEnabled || !authEnabled) return 'disabled';

    // Check if Supabase is properly configured
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!hasUrl || !hasKey) return 'disabled';

    return 'available';
  })();

  const value: EnhancedAuthContextType = {
    // Original auth context
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: auth.signOut,
    isAuthenticated: auth.isAuthenticated,
    isAnonymous: auth.isAnonymous,
    supabase: auth.supabase,

    // Enhanced properties
    authCapability,
    hasAuthenticatedBefore: authHistory.hasAuthenticatedBefore,
    isIntentionallyAnonymous: authHistory.isIntentionallyAnonymous,
    recommendsAuthentication: authHistory.recommendsAuthentication,
    isMultiUserDevice: authHistory.isMultiUserDevice,
    daysSinceLastAuth: authHistory.daysSinceLastAuth,

    // Auth history actions
    updateAuthPreference: authHistory.updatePreference,
    recordAuthenticationAttempt: authHistory.recordAuthenticationAttempt,
  };

  return <EnhancedAuthContext.Provider value={value}>{children}</EnhancedAuthContext.Provider>;
};

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Convenience hook that returns both original auth and enhanced features
export const useAuthWithHistory = () => {
  return useEnhancedAuth();
};
