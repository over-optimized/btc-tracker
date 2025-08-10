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
  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
      <Upload size={18} />
      Upload Transaction Files
    </h2>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
      <input
        type="file"
        accept=".csv"
        onChange={onUpload}
        className="hidden"
        id="file-upload"
        disabled={loading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
        <FileText size={40} className="text-gray-400" />
        <span className="text-base sm:text-lg font-medium text-gray-600">
          {loading ? 'Processing...' : 'Upload CSV file'}
        </span>
        <span className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
          Supports Strike, Coinbase, and Kraken formats
        </span>
      </label>
    </div>
    {transactionsCount > 0 && (
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <span className="text-xs sm:text-sm text-gray-600">{transactionsCount} transactions loaded</span>
        <button
          onClick={clearData}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear Data
        </button>
      </div>
    )}
  </div>
);

export default UploadTransactions;
