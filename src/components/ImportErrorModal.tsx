import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Download,
  RotateCcw,
  Edit,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  ImportError,
  ErrorRecoveryContext,
  RecoveryOption,
  ImportErrorType,
} from '../types/ImportError';

interface ImportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ImportError[];
  warnings: ImportError[];
  recoveryContext?: ErrorRecoveryContext;
  onRetry: (options: { action: string; data?: unknown }) => void;
  onExportErrors?: (data: ImportError[]) => void;
}

export default function ImportErrorModal({
  isOpen,
  onClose,
  errors,
  warnings,
  recoveryContext,
  onRetry,
  onExportErrors,
}: ImportErrorModalProps) {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'suggestions'>('errors');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['critical']));

  if (!isOpen) return null;

  const criticalErrors = errors.filter((error) => !error.recoverable);
  const recoverableErrors = errors.filter((error) => error.recoverable);
  const hasRecoveryOptions = recoveryContext?.recoveryOptions?.length > 0;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRecoveryAction = (option: RecoveryOption) => {
    switch (option.action) {
      case 'retry':
        onRetry(option.data || {});
        break;
      case 'export':
        if (onExportErrors && option.data) {
          onExportErrors(option.data);
        }
        break;
      case 'modify':
        // Could open a guide or help modal
        alert('Review the errors below and fix your CSV file, then try importing again.');
        break;
      default:
        console.warn('Unknown recovery action:', option.action);
    }
  };

  const getErrorIcon = (type: ImportErrorType) => {
    switch (type) {
      case ImportErrorType.FILE_READ_ERROR:
        return '📁';
      case ImportErrorType.INVALID_CSV_FORMAT:
        return '📋';
      case ImportErrorType.MISSING_REQUIRED_COLUMNS:
        return '📊';
      case ImportErrorType.INVALID_DATA_VALUES:
        return '🔢';
      case ImportErrorType.EMPTY_FILE:
        return '📄';
      case ImportErrorType.UNSUPPORTED_FORMAT:
        return '❓';
      case ImportErrorType.NETWORK_ERROR:
        return '🌐';
      default:
        return '⚠️';
    }
  };

  const renderErrorList = (
    errorList: ImportError[],
    title: string,
    severity: 'error' | 'warning',
  ) => {
    if (errorList.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4
          className={`font-semibold text-sm ${severity === 'error' ? 'text-red-700' : 'text-yellow-700'}`}
        >
          {title} ({errorList.length})
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {errorList.map((error, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                severity === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{getErrorIcon(error.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className={`font-medium text-sm ${
                        severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                      }`}
                    >
                      {error.message}
                    </p>
                    {error.rowNumber && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          severity === 'error'
                            ? 'bg-red-200 text-red-700'
                            : 'bg-yellow-200 text-yellow-700'
                        }`}
                      >
                        Row {error.rowNumber}
                      </span>
                    )}
                  </div>

                  {error.details && (
                    <p
                      className={`text-sm mb-2 ${
                        severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {error.details}
                    </p>
                  )}

                  {error.suggestions && error.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p
                        className={`text-xs font-medium mb-1 ${
                          severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                        }`}
                      >
                        Suggestions:
                      </p>
                      <ul
                        className={`text-xs space-y-1 ${
                          severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      >
                        {error.suggestions.slice(0, 3).map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Issues Found</h2>
              <p className="text-sm text-gray-600">
                {errors.length} errors, {warnings.length} warnings
                {recoveryContext?.detectedFormat && (
                  <span className="ml-2 text-blue-600">
                    ({recoveryContext.detectedFormat} format detected)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('errors')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'errors'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Errors ({errors.length})
            </button>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'warnings'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Warnings ({warnings.length})
            </button>
            {hasRecoveryOptions && (
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'suggestions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Solutions ({recoveryContext?.recoveryOptions?.length || 0})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            {activeTab === 'errors' && (
              <div className="space-y-6">
                {/* Critical Errors */}
                {criticalErrors.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('critical')}
                      className="flex items-center gap-2 text-red-700 font-semibold"
                    >
                      {expandedSections.has('critical') ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Critical Errors (Import Blocked)
                    </button>
                    {expandedSections.has('critical') &&
                      renderErrorList(criticalErrors, '', 'error')}
                  </div>
                )}

                {/* Recoverable Errors */}
                {recoverableErrors.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('recoverable')}
                      className="flex items-center gap-2 text-orange-700 font-semibold"
                    >
                      {expandedSections.has('recoverable') ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Minor Issues (Can be skipped)
                    </button>
                    {expandedSections.has('recoverable') &&
                      renderErrorList(recoverableErrors, '', 'error')}
                  </div>
                )}

                {errors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No errors found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'warnings' && (
              <div>
                {renderErrorList(warnings, 'Warnings', 'warning')}
                {warnings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No warnings found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'suggestions' && hasRecoveryOptions && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Recovery Options</h3>
                  <p className="text-sm text-blue-600">
                    Choose an option below to resolve the import issues:
                  </p>
                </div>

                {recoveryContext?.recoveryOptions?.map((option, _index) => (
                  <div
                    key={option.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {option.action === 'retry' && (
                            <RotateCcw className="w-4 h-4 text-blue-500" />
                          )}
                          {option.action === 'export' && (
                            <Download className="w-4 h-4 text-green-500" />
                          )}
                          {option.action === 'modify' && (
                            <Edit className="w-4 h-4 text-orange-500" />
                          )}
                          <h4 className="font-medium text-gray-900">{option.label}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      </div>
                      <button
                        onClick={() => handleRecoveryAction(option)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          option.action === 'retry'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : option.action === 'export'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {option.action === 'retry' && 'Try This'}
                        {option.action === 'export' && 'Download'}
                        {option.action === 'modify' && 'Get Help'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            💡 Tip: Most issues can be resolved by adjusting your CSV export settings
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            {hasRecoveryOptions && criticalErrors.length === 0 && (
              <button
                onClick={() =>
                  handleRecoveryAction({
                    id: 'skip-invalid',
                    label: '',
                    description: '',
                    action: 'retry',
                    data: { skipInvalidRows: true, allowPartialImport: true },
                  })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import Valid Rows
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
