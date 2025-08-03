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
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Upload size={20} />
      Upload Transaction Files
    </h2>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        accept=".csv"
        onChange={onUpload}
        className="hidden"
        id="file-upload"
        disabled={loading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
        <FileText size={48} className="text-gray-400" />
        <span className="text-lg font-medium text-gray-600">
          {loading ? 'Processing...' : 'Upload CSV file'}
        </span>
        <span className="text-sm text-gray-500">Supports Strike, Coinbase, and Kraken formats</span>
      </label>
    </div>
    {transactionsCount > 0 && (
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">{transactionsCount} transactions loaded</span>
        <button
          onClick={clearData}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear Data
        </button>
      </div>
    )}
  </div>
);

export default UploadTransactions;
