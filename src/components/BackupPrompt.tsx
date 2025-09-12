import React, { useState } from 'react';
import { useOptionalAuth } from '../contexts/AuthContext';

interface BackupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  transactionCount: number;
}

export const BackupPrompt: React.FC<BackupPromptProps> = ({
  isOpen,
  onClose,
  onCreateAccount,
  transactionCount,
}) => {
  const { supabase } = useOptionalAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if Supabase is not available
  if (!supabase || !isOpen || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onClose();
  };

  const handleCreateAccount = () => {
    onCreateAccount();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            {/* Backup Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mr-4">
              <svg
                className="w-5 h-5 text-orange-600 dark:text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Secure your data
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'} stored
                locally
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                💡 Why back up your data?
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>
                  • <strong>Never lose your data</strong> - Safe in the cloud
                </li>
                <li>
                  • <strong>Access anywhere</strong> - Any device, anytime
                </li>
                <li>
                  • <strong>Always in sync</strong> - Automatic updates
                </li>
                <li>
                  • <strong>100% free</strong> - No hidden costs
                </li>
              </ul>
            </div>

            {/* Current status */}
            <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Currently stored locally only
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Data could be lost if browser storage is cleared
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Primary action - Create account */}
            <button
              onClick={handleCreateAccount}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 
                       text-white font-medium rounded-lg transition-colors duration-200
                       focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Create free account & back up
              </div>
            </button>

            {/* Secondary action - Continue without backup */}
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 text-gray-700 dark:text-gray-300 
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       font-medium rounded-lg transition-colors duration-200
                       focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Continue without backup
            </button>
          </div>

          {/* Fine print */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your app works perfectly without an account.
              <br />
              This is just an optional backup feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
