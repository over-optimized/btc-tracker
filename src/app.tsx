import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './components/AppRoutes';
import FeatureFlagProvider, { ProductionSafetyWarning } from './components/FeatureFlagProvider';
import GlobalModals from './components/GlobalModals';
import ImportReminderToast from './components/ImportReminderToast';
import NavBar from './components/NavBar';
import { ThemeProvider } from './contexts/ThemeContext';
import { useBitcoinPrice } from './hooks/useBitcoinPrice';
import { useImportFlow } from './hooks/useImportFlow';
import { usePortfolioStats } from './hooks/usePortfolioStats';
import { useTransactionManager } from './hooks/useTransactionManager';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  // Custom hooks
  const transactionManager = useTransactionManager();
  const { currentPrice, lastUpdated, cached, source, loading, error } = useBitcoinPrice();
  const stats = usePortfolioStats(transactionManager.transactions, currentPrice);
  const importFlow = useImportFlow({
    onTransactionsMerged: transactionManager.mergeTransactions,
  });

  return (
    <>
      <NavBar />

      <AppRoutes
        transactions={transactionManager.transactions}
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
      <ProductionSafetyWarning />
      <AppContent />
    </ThemeProvider>
  </FeatureFlagProvider>
);

export default BitcoinTracker;
