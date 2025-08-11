import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2, CheckCircle, X, Info } from 'lucide-react';
import { ValidationResult, MigrationOptions, validateStoredData, migrateData, exportDataForBackup, clearAllData } from '../utils/dataValidation';
import { USJurisdictionNotice } from './educational';

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataResetComplete: () => void;
}

const DataValidationModal: React.FC<DataValidationModalProps> = ({
  isOpen,
  onClose,
  onDataResetComplete,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [migrationOptions, setMigrationOptions] = useState<MigrationOptions>({
    exportBeforeReset: true,
    preserveTransactionHistory: true,
    skipInvalidTransactions: true,
    resetToDefaults: false
  });
  const [currentStep, setCurrentStep] = useState<'validation' | 'migration' | 'export' | 'reset' | 'complete'>('validation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; errors: string[] } | null>(null);

  useEffect(() => {
    if (isOpen) {
      performValidation();
    }
  }, [isOpen]);

  const performValidation = () => {
    setIsProcessing(true);
    try {
      const result = validateStoredData();
      setValidationResult(result);
      
      if (result.isValid) {
        setCurrentStep('complete');
      } else if (result.canMigrate && !result.requiresReset) {
        setCurrentStep('migration');
      } else {
        setCurrentStep('export');
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMigration = async () => {
    if (!validationResult) return;
    
    setIsProcessing(true);
    try {
      const result = migrateData(migrationOptions);
      setMigrationResult(result);
      
      if (result.success) {
        setCurrentStep('complete');
      } else {
        setCurrentStep('export');
      }
    } catch (error) {
      setMigrationResult({ success: false, errors: [`Migration failed: ${error}`] });
      setCurrentStep('export');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportAndReset = async () => {
    setIsProcessing(true);
    try {
      // Export data if requested
      if (migrationOptions.exportBeforeReset) {
        const exportResult = exportDataForBackup();
        if (exportResult.success && exportResult.data) {
          // Trigger download
          const blob = new Blob([exportResult.data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportResult.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      // Clear all data
      clearAllData();
      setCurrentStep('complete');
      
      // Notify parent component
      onDataResetComplete();
    } catch (error) {
      console.error('Export and reset failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderValidationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Data Validation Required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Checking your stored data for compatibility with the latest version...
        </p>
      </div>
      
      {isProcessing ? (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Validating data...</span>
        </div>
      ) : (
        validationResult && (
          <div className="space-y-3">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Issues Found:</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Warnings:</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );

  const renderMigrationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <RefreshCw className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Data Migration Available
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your data can be automatically updated to work with the latest version.
        </p>
      </div>
      
      {validationResult && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Migration Summary:</strong>
            <ul className="mt-2 space-y-1">
              <li>• {validationResult.migratableTransactions} transactions can be migrated</li>
              <li>• {validationResult.invalidTransactions} transactions may need review</li>
              <li>• Your data will be preserved with updated structure</li>
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Migration Options:</h4>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={migrationOptions.skipInvalidTransactions}
            onChange={(e) => setMigrationOptions(prev => ({ ...prev, skipInvalidTransactions: e.target.checked }))}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Skip invalid transactions (recommended)
          </span>
        </label>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={migrationOptions.exportBeforeReset}
            onChange={(e) => setMigrationOptions(prev => ({ ...prev, exportBeforeReset: e.target.checked }))}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Export backup before migration
          </span>
        </label>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleMigration}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Migrate Data
        </button>
        <button
          onClick={() => setCurrentStep('export')}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Reset Instead
        </button>
      </div>
    </div>
  );

  const renderExportStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Download className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export & Reset Required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your data needs to be reset for compatibility. Export your data first to avoid losing it.
        </p>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Pre-Alpha Notice:</strong> This application is in pre-alpha development. 
            Data structure changes are expected and may require resets. Your exported data 
            can be manually imported later if needed.
          </div>
        </div>
      </div>

      {migrationResult && !migrationResult.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Migration Failed:</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {migrationResult.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={migrationOptions.exportBeforeReset}
            onChange={(e) => setMigrationOptions(prev => ({ ...prev, exportBeforeReset: e.target.checked }))}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Export my data before reset (recommended)
          </span>
        </label>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleExportAndReset}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {migrationOptions.exportBeforeReset ? 'Export & Reset' : 'Reset Data'}
        </button>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {migrationResult?.success ? 'Migration Complete!' : 'Data Validated'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {migrationResult?.success 
            ? 'Your data has been successfully updated to the latest version.'
            : 'Your data is compatible with the current version.'
          }
        </p>
      </div>
      
      {migrationResult?.success && migrationResult.errors.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Migration Notes:</h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            {migrationResult.errors.map((note, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
      >
        Continue to App
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Data Compatibility Check
          </h2>
          {currentStep === 'complete' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="p-6">
          {currentStep === 'validation' && renderValidationStep()}
          {currentStep === 'migration' && renderMigrationStep()}
          {currentStep === 'export' && renderExportStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <USJurisdictionNotice variant="compact" includeDisclaimer={false} />
        </div>
      </div>
    </div>
  );
};

export default DataValidationModal;