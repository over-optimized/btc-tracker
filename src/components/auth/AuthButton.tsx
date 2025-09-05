import React, { useState } from 'react';
import { useOptionalAuth } from '../../contexts/AuthContext';

interface AuthButtonProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
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
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-16 rounded"></div>
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* User info */}
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
              Signing out...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </>
          )}
        </button>
      </div>
    );
  }

  // Anonymous state - show optional auth CTA
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Optional backup CTA */}
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-xs text-gray-500 dark:text-gray-400">Back up your data</span>
      </div>

      {/* Sign in button */}
      <button
        onClick={onOpenLogin}
        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                   bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                   rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 
                   focus:ring-2 focus:ring-orange-500 focus:border-transparent
                   transition-colors duration-200"
      >
        Sign in
      </button>

      {/* Sign up button */}
      <button
        onClick={onOpenSignup}
        className="px-3 py-2 text-sm font-medium text-white 
                   bg-orange-600 hover:bg-orange-700 
                   border border-transparent rounded-lg 
                   focus:ring-2 focus:ring-orange-500 focus:border-transparent
                   transition-colors duration-200"
      >
        Sign up
      </button>
    </div>
  );
};
