import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorRecoveryContext, ImportError } from '../types/ImportError';
import { ClassificationDecision, ClassificationPrompt } from '../types/TransactionClassification';
import { Transaction } from '../types/Transaction';
import { EnhancedCSVProcessor, EnhancedProcessOptions } from '../utils/enhancedCsvProcessor';
import { exportProblematicRows } from '../utils/errorRecovery';

interface ImportState {
  loading: boolean;
  uploadProgress: number;
  importModalOpen: boolean;
  errorModalOpen: boolean;
  importedCount: number;
  ignoredCount: number;
  importSummary: string;
  importErrors: ImportError[];
  importWarnings: ImportError[];
  recoveryContext?: ErrorRecoveryContext;
  withdrawalModalOpen: boolean;
  classificationModalOpen: boolean;
  classificationPrompts: ClassificationPrompt[];
  pendingClassificationCallback: ((decisions: ClassificationDecision[]) => void) | null;
}

interface ImportFlowResult {
  state: ImportState;
  handlers: {
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleRetry: (retryOptions: any) => void;
    handleExportErrors: (data: any) => void;
    handleViewErrorDetails: () => void;
    handleClassificationComplete: (decisions: ClassificationDecision[]) => Promise<void>;
    setImportModalOpen: (open: boolean) => void;
    setErrorModalOpen: (open: boolean) => void;
    setWithdrawalModalOpen: (open: boolean) => void;
    setClassificationModalOpen: (open: boolean) => void;
    setPendingClassificationCallback: (callback: ((decisions: ClassificationDecision[]) => void) | null) => void;
    setClassificationPrompts: (prompts: ClassificationPrompt[]) => void;
  };
}

interface UseImportFlowProps {
  onTransactionsMerged: (newTransactions: Transaction[]) => { merged: Transaction[]; duplicateCount: number };
}

export const useImportFlow = ({ onTransactionsMerged }: UseImportFlowProps): ImportFlowResult => {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<ImportState>({
    loading: false,
    uploadProgress: 0,
    importModalOpen: false,
    errorModalOpen: false,
    importedCount: 0,
    ignoredCount: 0,
    importSummary: '',
    importErrors: [],
    importWarnings: [],
    withdrawalModalOpen: false,
    classificationModalOpen: false,
    classificationPrompts: [],
    pendingClassificationCallback: null,
  });

  const updateState = (updates: Partial<ImportState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const processFile = async (file: File, retryOptions?: any) => {
    updateState({ loading: true, uploadProgress: 0 });

    const options: EnhancedProcessOptions = {
      allowPartialImport: true,
      skipInvalidRows: true,
      maxErrors: 50,
      progressCallback: (progress) => updateState({ uploadProgress: progress }),
      ...retryOptions,
    };

    try {
      const processor = new EnhancedCSVProcessor(options);
      const result = await processor.processCSVFile(file);

      updateState({ loading: false, uploadProgress: 100 });

      if (result.needsClassification && result.classificationPrompts) {
        // Show classification modal for ambiguous transactions
        updateState({
          classificationPrompts: result.classificationPrompts,
          pendingClassificationCallback: () => result.onClassificationComplete!,
          classificationModalOpen: true,
        });
        return;
      }

      if (result.success && result.importedCount > 0) {
        // Success - merge with existing transactions
        const newTransactions = (result as any).transactions || [];
        const mergeResult = onTransactionsMerged(newTransactions);

        // Set results for summary modal
        updateState({
          importedCount: result.importedCount,
          ignoredCount: mergeResult.duplicateCount + result.ignoredCount,
          importSummary: result.summary,
          importErrors: result.errors,
          importWarnings: result.warnings,
          importModalOpen: true,
        });

        // Navigate to dashboard
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        // Failed or no transactions imported
        updateState({
          importErrors: result.errors,
          importWarnings: result.warnings,
          errorModalOpen: true,
        });
      }
    } catch (error) {
      updateState({
        loading: false,
        importErrors: [
          {
            type: 'FILE_READ_ERROR' as any,
            message: 'Unexpected error during file processing',
            details: String(error),
            suggestions: ['Try again with a different file', 'Contact support if error persists'],
            recoverable: false,
          },
        ],
        errorModalOpen: true,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleRetry = (retryOptions: any) => {
    updateState({ errorModalOpen: false });
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput?.files?.[0]) {
      processFile(fileInput.files[0], retryOptions);
    }
  };

  const handleExportErrors = (data: any) => {
    exportProblematicRows(data, `errors-${Date.now()}.csv`);
  };

  const handleViewErrorDetails = () => {
    updateState({
      importModalOpen: false,
      errorModalOpen: true,
    });
  };

  const handleClassificationComplete = async (decisions: ClassificationDecision[]) => {
    updateState({ classificationModalOpen: false });

    if (!state.pendingClassificationCallback) return;

    try {
      const result = state.pendingClassificationCallback(decisions) as any;

      if (result.success && result.transactions.length > 0) {
        // Merge classified transactions with existing ones
        const mergeResult = onTransactionsMerged(result.transactions);

        // Show success modal
        updateState({
          importedCount: result.importedCount,
          ignoredCount: mergeResult.duplicateCount + result.ignoredCount,
          importSummary: result.summary,
          importErrors: result.errors,
          importWarnings: result.warnings,
          importModalOpen: true,
        });

        // Navigate to dashboard
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        // Handle classification errors
        updateState({
          importErrors: result.errors,
          importWarnings: result.warnings,
          errorModalOpen: true,
        });
      }
    } catch (error) {
      updateState({
        importErrors: [
          {
            type: 'CLASSIFICATION_ERROR' as any,
            message: 'Error processing classified transactions',
            details: String(error),
            suggestions: ['Try importing the file again'],
            recoverable: false,
          },
        ],
        errorModalOpen: true,
      });
    } finally {
      updateState({
        pendingClassificationCallback: null,
        classificationPrompts: [],
      });
    }
  };

  return {
    state,
    handlers: {
      handleFileUpload,
      handleRetry,
      handleExportErrors,
      handleViewErrorDetails,
      handleClassificationComplete,
      setImportModalOpen: (open) => updateState({ importModalOpen: open }),
      setErrorModalOpen: (open) => updateState({ errorModalOpen: open }),
      setWithdrawalModalOpen: (open) => updateState({ withdrawalModalOpen: open }),
      setClassificationModalOpen: (open) => updateState({ classificationModalOpen: open }),
      setPendingClassificationCallback: (callback) => updateState({ pendingClassificationCallback: callback }),
      setClassificationPrompts: (prompts) => updateState({ classificationPrompts: prompts }),
    },
  };
};