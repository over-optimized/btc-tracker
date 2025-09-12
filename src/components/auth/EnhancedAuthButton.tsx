import React, { useState } from 'react';
import { useAuthWithHistory } from '../../contexts/EnhancedAuthContext';
import { useTransactionCount } from '../../hooks/useTransactionCount';
import { useTransactionManager } from '../../hooks/useTransactionManager';

interface EnhancedAuthButtonProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  className?: string;
}

export const EnhancedAuthButton: React.FC<EnhancedAuthButtonProps> = ({
  onOpenLogin,
  onOpenSignup,
  className = '',
}) => {
  const auth = useAuthWithHistory();
  const transactionManager = useTransactionManager();
  const transactionCount = useTransactionCount(transactionManager.transactions);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Don't show auth button if Supabase is not configured
  if (auth.authCapability === 'disabled') {
    return null;
  }

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleAuthAction = (action: 'login' | 'signup') => {
    // Record authentication attempt for context awareness
    auth.recordAuthenticationAttempt();

    if (action === 'login') {
      onOpenLogin();
    } else {
      onOpenSignup();
    }
  };

  // Loading state
  if (auth.loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-9 w-32 rounded-lg"></div>
      </div>
    );
  }

  // Authenticated state - space-efficient with tooltip
  if (auth.isAuthenticated && auth.user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Status indicator - hidden on mobile, tooltip on desktop */}
        <div className="hidden sm:flex flex-col items-end group relative">
          <span
            className="text-sm font-medium cursor-help"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Synced to cloud
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">
            {auth.daysSinceLastAuth !== null && auth.daysSinceLastAuth === 0
              ? 'Updated today'
              : 'Active sync'}
          </span>

          {/* Hover tooltip with detailed info */}
          <div
            className="absolute top-full right-0 mt-1 py-2 px-3 bg-gray-900 dark:bg-gray-700 
                          text-white text-xs rounded-lg shadow-lg min-w-48
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-all duration-200 z-50"
          >
            <div className="font-medium">{auth.user.email}</div>
            <div className="text-gray-300 dark:text-gray-400 mt-1">
              Last sync:{' '}
              {auth.daysSinceLastAuth === 0 ? 'Today' : `${auth.daysSinceLastAuth} days ago`}
            </div>
            {auth.isMultiUserDevice && (
              <div className="text-gray-300 dark:text-gray-400 mt-1">Multi-user device</div>
            )}
          </div>
        </div>

        {/* Mobile: Just sync indicator */}
        <div className="sm:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-900 dark:text-gray-300">Synced</span>
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          disabled={signOutLoading}
          className="flex items-center px-3 py-2 text-sm font-medium text-slate-900 dark:text-gray-300 
                     bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          {signOutLoading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              <span className="hidden sm:inline">Signing out...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Anonymous state - context-aware messaging
  const getContextualMessage = () => {
    // Has data but never authenticated - suggest backup
    if (transactionCount > 0 && !auth.hasAuthenticatedBefore) {
      return {
        primary: 'Backup & Sync',
        secondary: `Backup your ${transactionCount} transactions`,
        icon: 'backup',
      };
    }

    // Previously authenticated but currently offline - suggest sign in
    if (auth.hasAuthenticatedBefore && !auth.isAuthenticated) {
      return {
        primary: 'Sign in',
        secondary: 'Access your synced data',
        icon: 'signin',
      };
    }

    // Intentionally anonymous - respect choice
    if (auth.isIntentionallyAnonymous) {
      return {
        primary: 'Local only',
        secondary: 'Data stays on device',
        icon: 'local',
      };
    }

    // Multi-user device - generic message
    if (auth.isMultiUserDevice) {
      return {
        primary: 'Sign in',
        secondary: 'Access your account',
        icon: 'signin',
      };
    }

    // Default for new users
    return {
      primary: 'Backup & Sync',
      secondary: 'Save data to cloud',
      icon: 'backup',
    };
  };

  const contextualMessage = getContextualMessage();

  return (
    <div className={`flex items-center ${className}`}>
      {/* Desktop: Context-aware messaging with tooltip */}
      <div className="hidden sm:flex items-center space-x-3">
        <div className="relative group">
          <button
            onClick={() => handleAuthAction('signup')}
            className="px-4 py-2 text-sm font-medium text-white 
                       bg-orange-600 hover:bg-orange-700 
                       border border-transparent rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       transition-colors duration-200
                       shadow-sm hover:shadow-md"
          >
            {contextualMessage.primary}
          </button>

          {/* Enhanced hover tooltip with context and secondary action */}
          <div
            className="absolute top-full right-0 mt-1 py-2 px-3 bg-gray-900 dark:bg-gray-700 
                          text-white text-xs rounded-lg shadow-lg min-w-56
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-all duration-200 z-50"
          >
            <div className="font-medium">{contextualMessage.secondary}</div>
            {auth.hasAuthenticatedBefore && (
              <>
                <div className="border-t border-gray-600 dark:border-gray-500 mt-2 pt-2">
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
                  >
                    Already have data? Sign in instead
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Compact context-aware button */}
      <div className="sm:hidden">
        <div className="relative group">
          {/* Main auth button */}
          <button
            onClick={() => handleAuthAction('signup')}
            className="flex items-center px-3 py-2 text-sm font-medium text-white 
                       bg-orange-600 hover:bg-orange-700 
                       border border-transparent rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       transition-colors duration-200"
          >
            {contextualMessage.icon === 'backup' ? (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10M7 17h4"
                />
              </svg>
            ) : contextualMessage.icon === 'signin' ? (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h2m8-12V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V8z"
                />
              </svg>
            )}

            {contextualMessage.primary === 'Backup & Sync'
              ? 'Sync'
              : contextualMessage.primary === 'Local only'
                ? 'Local'
                : 'Sign in'}

            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Mobile dropdown for secondary options */}
          {auth.hasAuthenticatedBefore && (
            <div
              className="absolute top-full right-0 mt-1 py-1 w-32 bg-white dark:bg-gray-800 
                            border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            group-focus-within:opacity-100 group-focus-within:visible
                            transition-all duration-200 z-50"
            >
              <button
                onClick={() => handleAuthAction('login')}
                className="block w-full px-3 py-2 text-left text-sm text-slate-900 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {contextualMessage.secondary}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
