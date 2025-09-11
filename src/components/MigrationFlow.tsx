import React, { useState } from 'react';
import { useOptionalAuth } from '../contexts/AuthContext';
import { AutoStorageProvider } from '../utils/AutoStorageProvider';

interface MigrationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storageProvider: AutoStorageProvider | null;
  transactionCount: number;
}

type MigrationStep = 'intro' | 'migrating' | 'success' | 'error';

export const MigrationFlow: React.FC<MigrationFlowProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storageProvider,
  transactionCount,
}) => {
  const { isAuthenticated, user } = useOptionalAuth();
  const [step, setStep] = useState<MigrationStep>('intro');
  const [migrationResult, setMigrationResult] = useState<{
    migrated: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    if (!storageProvider || !isAuthenticated) {
      setError('Cannot migrate: authentication required');
      setStep('error');
      return;
    }

    setStep('migrating');
    setError(null);

    try {
      const result = await storageProvider.migrateToAuthenticated();

      if (result.success) {
        setMigrationResult(result.data || null);
        setStep('success');
      } else {
        setError(result.error || 'Migration failed');
        setStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during migration');
      setStep('error');
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-600 dark:text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Move your data to the cloud
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as {user?.email}</p>
            </div>

            {/* What will happen */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Here&apos;s what will happen:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-500 mr-2">1.</span>
                  <div>
                    <strong>Secure backup:</strong> Your {transactionCount}{' '}
                    {transactionCount === 1 ? 'transaction' : 'transactions'} will be safely copied
                    to the cloud
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-500 mr-2">2.</span>
                  <div>
                    <strong>Zero downtime:</strong> Your app continues working normally during the
                    process
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-500 mr-2">3.</span>
                  <div>
                    <strong>Automatic sync:</strong> Future changes will sync across all your
                    devices
                  </div>
                </li>
              </ul>
            </div>

            {/* Safety note */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                    100% Safe Migration
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Your local data stays untouched until migration is confirmed successful. You can
                    always go back to local-only storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleStartMigration}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 
                         text-white font-medium rounded-lg transition-colors duration-200
                         focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Start Migration
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-gray-700 dark:text-gray-300 
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         font-medium rounded-lg transition-colors duration-200"
              >
                Maybe Later
              </button>
            </div>
          </div>
        );

      case 'migrating':
        return (
          <div className="p-6 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Migrating your data...
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we securely transfer your {transactionCount}{' '}
              {transactionCount === 1 ? 'transaction' : 'transactions'} to the cloud.
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This should only take a few seconds
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Migration Complete!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {migrationResult?.migrated}{' '}
              {migrationResult?.migrated === 1 ? 'transaction' : 'transactions'} successfully backed
              up to the cloud
            </p>

            {/* Benefits achieved */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                🎉 You now have:
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <li>✓ Automatic cloud backup of all your data</li>
                <li>✓ Access from any device with your account</li>
                <li>✓ Real-time sync across all your devices</li>
                <li>✓ Never lose your transaction history again</li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 
                       text-white font-medium rounded-lg transition-colors duration-200
                       focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Continue Using App
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Migration Failed
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>

            {/* Reassurance */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Your data is safe
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Nothing was lost during the failed migration. Your {transactionCount}{' '}
                    {transactionCount === 1 ? 'transaction' : 'transactions'} are still safely
                    stored locally and the app continues to work normally.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('intro');
                  setError(null);
                }}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 
                         text-white font-medium rounded-lg transition-colors duration-200
                         focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-gray-700 dark:text-gray-300 
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         font-medium rounded-lg transition-colors duration-200"
              >
                Continue Locally
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Close button (only show if not migrating) */}
        {step !== 'migrating' && (
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
};
