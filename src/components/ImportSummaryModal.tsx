import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ImportSummaryModalProps {
  open: boolean;
  onClose: () => void;
  importedCount: number;
  ignoredCount: number;
  summary: string;
}

const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({
  open,
  onClose,
  importedCount,
  ignoredCount,
  summary,
}) => {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Import Summary</h2>
        <p className="mb-2">
          <span className="font-semibold">Imported:</span> {importedCount}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Ignored (duplicates):</span> {ignoredCount}
        </p>
        <p className="mb-4 text-gray-600">{summary}</p>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-2"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            onClick={() => {
              onClose();
              navigate('/upload');
              setTimeout(() => {
                const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
                if (fileInput) fileInput.click();
              }, 100);
            }}
          >
            Upload Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSummaryModal;
