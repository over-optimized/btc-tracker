import React from 'react';
import { CheckCircle, AlertTriangle, Upload, Eye } from 'lucide-react';
import { ImportError } from '../types/ImportError';

interface ImportSummaryModalProps {
  open: boolean;
  onClose: () => void;
  importedCount: number;
  ignoredCount: number;
  summary: string;
  errors?: ImportError[];
  warnings?: ImportError[];
  onViewDetails?: () => void;
  onUploadAnother?: () => void;
}

const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({
  open,
  onClose,
  importedCount,
  ignoredCount,
  summary,
  errors = [],
  warnings = [],
  onViewDetails,
  onUploadAnother,
}) => {
  if (!open) return null;

  const hasIssues = errors.length > 0 || warnings.length > 0;
  const criticalErrors = errors.filter((e) => !e.recoverable);
  const isSuccess = importedCount > 0 && criticalErrors.length === 0;

  const handleUploadAnother = () => {
    onClose();
    if (onUploadAnother) {
      onUploadAnother();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header with status */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          {isSuccess ? (
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {isSuccess ? 'Import Completed' : 'Import Issues'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {isSuccess ? 'Your transactions have been processed' : 'Some issues were encountered'}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{importedCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Imported</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-500">{ignoredCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Skipped</div>
            </div>
          </div>

          {hasIssues && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {errors.length > 0 && (
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-red-600">
                      {errors.length}
                    </div>
                    <div className="text-xs text-gray-600">Errors</div>
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-yellow-600">
                      {warnings.length}
                    </div>
                    <div className="text-xs text-gray-600">Warnings</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary message */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{summary}</p>

          {hasIssues && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Need help?</span> Click &quot;View Details&quot; to
                see specific issues and get suggestions on how to fix them.
              </p>
            </div>
          )}
        </div>

        {/* Issue preview */}
        {hasIssues && (
          <div className="mb-6">
            <div className="space-y-2">
              {criticalErrors.slice(0, 2).map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm"
                >
                  <span className="text-red-500 text-xs mt-0.5">●</span>
                  <span className="text-red-700 flex-1">{error.message}</span>
                </div>
              ))}

              {warnings.slice(0, 1).map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                >
                  <span className="text-yellow-500 text-xs mt-0.5">●</span>
                  <span className="text-yellow-700 flex-1">{warning.message}</span>
                </div>
              ))}

              {errors.length + warnings.length > 3 && (
                <div className="text-center text-sm text-gray-500 py-1">
                  ... and {errors.length + warnings.length - 3} more issues
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="order-3 sm:order-1 flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-center text-sm sm:text-base"
          >
            Close
          </button>

          {hasIssues && onViewDetails && (
            <button
              onClick={onViewDetails}
              className="order-2 flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm sm:text-base"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              View Details
            </button>
          )}

          <button
            onClick={handleUploadAnother}
            className="order-1 sm:order-3 flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            Upload Another
          </button>
        </div>

        {/* Success celebration */}
        {isSuccess && importedCount > 0 && !hasIssues && (
          <div className="mt-4 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm text-gray-600">All transactions imported successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportSummaryModal;
