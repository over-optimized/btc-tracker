import React from 'react';
import AddWithdrawalModal from './AddWithdrawalModal';
import ImportErrorModal from './ImportErrorModal';
import ImportSummaryModal from './ImportSummaryModal';
import TransactionClassificationModal from './TransactionClassificationModal';
import { ErrorRecoveryContext, ImportError } from '../types/ImportError';
import { Transaction } from '../types/Transaction';
import { ClassificationDecision, ClassificationPrompt } from '../types/TransactionClassification';

interface GlobalModalsProps {
  // Import Summary Modal
  importModalOpen: boolean;
  onImportModalClose: () => void;
  importedCount: number;
  ignoredCount: number;
  importSummary: string;
  importErrors: ImportError[];
  importWarnings: ImportError[];
  onViewErrorDetails: () => void;
  onUploadAnother?: () => void;

  // Import Error Modal
  errorModalOpen: boolean;
  onErrorModalClose: () => void;
  recoveryContext?: ErrorRecoveryContext;
  onRetry: (retryOptions: any) => void;
  onExportErrors: (data: any) => void;

  // Add Withdrawal Modal
  withdrawalModalOpen: boolean;
  onWithdrawalModalClose: () => void;
  onAddWithdrawal: (withdrawal: Transaction) => void;
  exchanges: string[];

  // Transaction Classification Modal
  classificationModalOpen: boolean;
  onClassificationModalClose: () => void;
  classificationPrompts: ClassificationPrompt[];
  onClassify: (decisions: ClassificationDecision[]) => void;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
  // Import Summary Modal props
  importModalOpen,
  onImportModalClose,
  importedCount,
  ignoredCount,
  importSummary,
  importErrors,
  importWarnings,
  onViewErrorDetails,
  onUploadAnother,

  // Import Error Modal props
  errorModalOpen,
  onErrorModalClose,
  recoveryContext,
  onRetry,
  onExportErrors,

  // Add Withdrawal Modal props
  withdrawalModalOpen,
  onWithdrawalModalClose,
  onAddWithdrawal,
  exchanges,

  // Transaction Classification Modal props
  classificationModalOpen,
  onClassificationModalClose,
  classificationPrompts,
  onClassify,
}) => {
  return (
    <>
      <ImportSummaryModal
        open={importModalOpen}
        onClose={onImportModalClose}
        importedCount={importedCount}
        ignoredCount={ignoredCount}
        summary={importSummary}
        errors={importErrors}
        warnings={importWarnings}
        onViewDetails={onViewErrorDetails}
        onUploadAnother={onUploadAnother}
      />

      <ImportErrorModal
        isOpen={errorModalOpen}
        onClose={onErrorModalClose}
        errors={importErrors}
        warnings={importWarnings}
        recoveryContext={recoveryContext}
        onRetry={onRetry}
        onExportErrors={onExportErrors}
      />

      <AddWithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={onWithdrawalModalClose}
        onAdd={onAddWithdrawal}
        exchanges={exchanges}
      />

      <TransactionClassificationModal
        isOpen={classificationModalOpen}
        onClose={onClassificationModalClose}
        prompts={classificationPrompts}
        onClassify={onClassify}
      />
    </>
  );
};

export default GlobalModals;