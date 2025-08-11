import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import React from 'react';
import { MigrationResult } from '../utils/dataMigration';

interface MigrationModalProps {
  open: boolean;
  onClose: () => void;
  migrationResult: MigrationResult;
  onRestoreBackup?: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  open,
  onClose,
  migrationResult,
  onRestoreBackup,
}) => {
  if (!open) return null;

  const hasIssues = migrationResult.errorCount > 0 || migrationResult.duplicatesRemoved > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          {migrationResult.success ? (
            <CheckCircle className="text-green-500" size={24} />
          ) : (
            <AlertCircle className="text-red-500" size={24} />
          )}
          <h2 className="text-xl font-bold">
            {migrationResult.success ? 'Data Migration Complete' : 'Migration Issues'}
          </h2>
        </div>

        {migrationResult.success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="text-green-600" size={16} />
                <span className="font-medium text-green-800">Migration Summary</span>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>✅ {migrationResult.migratedCount} transactions updated</p>
                {migrationResult.duplicatesRemoved > 0 && (
                  <p>🧹 {migrationResult.duplicatesRemoved} duplicate transactions removed</p>
                )}
                {migrationResult.backupCreated && <p>💾 Backup created for safety</p>}
              </div>
            </div>

            {hasIssues && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-yellow-600" size={16} />
                  <span className="font-medium text-yellow-800">Issues Resolved</span>
                </div>
                <div className="space-y-1 text-sm text-yellow-700">
                  {migrationResult.duplicatesRemoved > 0 && (
                    <p>• Removed {migrationResult.duplicatesRemoved} duplicate entries</p>
                  )}
                  {migrationResult.errorCount > 0 && (
                    <p>• Fixed {migrationResult.errorCount} data inconsistencies</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">What&apos;s new:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Improved duplicate detection</li>
                  <li>More reliable CSV re-importing</li>
                  <li>Better data consistency</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">Migration encountered issues</p>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-4">
          {onRestoreBackup && (
            <button
              onClick={onRestoreBackup}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Restore Backup
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
