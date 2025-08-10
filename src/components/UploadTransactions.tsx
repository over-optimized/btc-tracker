import { FileText, Upload } from 'lucide-react';
import React from 'react';

interface UploadTransactionsProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  transactionsCount: number;
  clearData: () => void;
}

const UploadTransactions: React.FC<UploadTransactionsProps> = ({
  onUpload,
  loading,
  transactionsCount,
  clearData,
}) => (
  <div className="card-base p-4 sm:p-6 mb-4 sm:mb-6">
    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
      <Upload size={18} className="text-gray-800 dark:text-gray-200" />
      Upload Transaction Files
    </h2>
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
      <input
        type="file"
        accept=".csv"
        onChange={onUpload}
        className="hidden"
        id="file-upload"
        disabled={loading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
        <FileText size={40} className="text-gray-400 dark:text-gray-500" />
        <span className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">
          {loading ? 'Processing...' : 'Upload CSV file'}
        </span>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
          Supports Strike, Coinbase, and Kraken formats
        </span>
      </label>
    </div>
    {transactionsCount > 0 && (
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{transactionsCount} transactions loaded</span>
        <button
          onClick={clearData}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
        >
          Clear Data
        </button>
      </div>
    )}
  </div>
);

export default UploadTransactions;
