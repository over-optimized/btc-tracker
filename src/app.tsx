import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './components/AppRoutes';
import FeatureFlagProvider, { ProductionSafetyWarning } from './components/FeatureFlagProvider';
import GlobalModals from './components/GlobalModals';
import ImportReminderToast from './components/ImportReminderToast';
import NavBar from './components/NavBar';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useOptionalAuth } from './contexts/AuthContext';
import { useBitcoinPrice } from './hooks/useBitcoinPrice';
import { useImportFlow } from './hooks/useImportFlow';
import { usePortfolioStats } from './hooks/usePortfolioStats';
import { useTransactionManager } from './hooks/useTransactionManager';
import { useTransactionCount } from './hooks/useTransactionCount';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  // Get auth context to coordinate loading states
  const auth = useOptionalAuth();

  // Custom hooks
  const transactionManager = useTransactionManager();
  const { currentPrice, lastUpdated, cached, source, loading, error } = useBitcoinPrice();
  const stats = usePortfolioStats(transactionManager.transactions, currentPrice);
  const transactionCount = useTransactionCount(transactionManager.transactions);
  const importFlow = useImportFlow({
    onTransactionsMerged: transactionManager.mergeTransactions,
  });

  // Show loading screen while auth or storage is initializing
  if (auth.loading || transactionManager.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-orange-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {auth.loading ? 'Initializing authentication...' : 'Loading your data...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error screen if storage initialization failed
  if (transactionManager.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
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
            Storage Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{transactionManager.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />

      <AppRoutes
        transactions={transactionManager.transactions}
        transactionCount={transactionCount}
        currentPrice={currentPrice}
        stats={stats}
        lastUpdated={lastUpdated}
        cached={cached}
        source={source}
        priceLoading={loading}
        priceError={error}
        onFileUpload={importFlow.handlers.handleFileUpload}
        loading={importFlow.state.loading}
        clearData={transactionManager.clearAllTransactions}
        onAddWithdrawal={() => importFlow.handlers.setWithdrawalModalOpen(true)}
      />

      <GlobalModals
        // Import Summary Modal
        importModalOpen={importFlow.state.importModalOpen}
        onImportModalClose={() => importFlow.handlers.setImportModalOpen(false)}
        importedCount={importFlow.state.importedCount}
        ignoredCount={importFlow.state.ignoredCount}
        importSummary={importFlow.state.importSummary}
        importErrors={importFlow.state.importErrors}
        importWarnings={importFlow.state.importWarnings}
        onViewErrorDetails={importFlow.handlers.handleViewErrorDetails}
        onUploadAnother={() => {
          navigate('/upload');
          setTimeout(() => {
            const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
            if (fileInput) fileInput.click();
          }, 100);
        }}
        // Import Error Modal
        errorModalOpen={importFlow.state.errorModalOpen}
        onErrorModalClose={() => importFlow.handlers.setErrorModalOpen(false)}
        recoveryContext={importFlow.state.recoveryContext}
        onRetry={importFlow.handlers.handleRetry}
        onExportErrors={importFlow.handlers.handleExportErrors}
        // Add Withdrawal Modal
        withdrawalModalOpen={importFlow.state.withdrawalModalOpen}
        onWithdrawalModalClose={() => importFlow.handlers.setWithdrawalModalOpen(false)}
        onAddWithdrawal={transactionManager.addTransaction}
        exchanges={transactionManager.getExchangesList()}
        // Transaction Classification Modal
        classificationModalOpen={importFlow.state.classificationModalOpen}
        onClassificationModalClose={() => {
          importFlow.handlers.setClassificationModalOpen(false);
          importFlow.handlers.setPendingClassificationCallback(null);
          importFlow.handlers.setClassificationPrompts([]);
        }}
        classificationPrompts={importFlow.state.classificationPrompts}
        onClassify={importFlow.handlers.handleClassificationComplete}
      />

      <ImportReminderToast
        transactions={transactionManager.transactions}
        onImportClick={() => navigate('/upload')}
      />
    </>
  );
};

const BitcoinTracker: React.FC = () => (
  <FeatureFlagProvider>
    <ThemeProvider>
      <AuthProvider>
        <ProductionSafetyWarning />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  </FeatureFlagProvider>
);

export default BitcoinTracker;
