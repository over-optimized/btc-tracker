import React, { useState } from 'react';
import { useOptionalAuth } from '../../contexts/AuthContext';

interface UnifiedAuthButtonProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  className?: string;
}

export const UnifiedAuthButton: React.FC<UnifiedAuthButtonProps> = ({
  onOpenLogin,
  onOpenSignup,
  className = '',
}) => {
  const { user, signOut, loading, isAuthenticated, supabase } = useOptionalAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Don't show auth button if Supabase is not configured
  if (!supabase) {
    return null;
  }

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSignOutLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-9 w-32 rounded-lg"></div>
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* User info - hidden on mobile */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Synced to cloud</span>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          disabled={signOutLoading}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
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

  // Anonymous state - unified auth approach
  return (
    <div className={`flex items-center ${className}`}>
      {/* Desktop: Primary CTA with secondary sign in link */}
      <div className="hidden sm:flex items-center space-x-3">
        <div className="flex flex-col items-end text-right">
          <button
            onClick={onOpenSignup}
            className="px-4 py-2 text-sm font-medium text-white 
                       bg-orange-600 hover:bg-orange-700 
                       border border-transparent rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       transition-colors duration-200
                       shadow-sm hover:shadow-md"
          >
            Backup & Sync
          </button>
          <button
            onClick={onOpenLogin}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 
                       transition-colors duration-200 mt-1"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>

      {/* Mobile: Compact dropdown-style button */}
      <div className="sm:hidden">
        <div className="relative group">
          {/* Main auth button */}
          <button
            onClick={onOpenSignup}
            className="flex items-center px-3 py-2 text-sm font-medium text-white 
                       bg-orange-600 hover:bg-orange-700 
                       border border-transparent rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10M7 17h4"
              />
            </svg>
            Sync
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Dropdown for sign in option */}
          <div
            className="absolute top-full right-0 mt-1 py-1 w-32 bg-white dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          group-focus-within:opacity-100 group-focus-within:visible
                          transition-all duration-200 z-50"
          >
            <button
              onClick={onOpenLogin}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
