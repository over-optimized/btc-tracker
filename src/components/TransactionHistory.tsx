import { Bitcoin } from 'lucide-react';
import React, { useState } from 'react';
import { Transaction } from '../types/Transaction';
import { formatBTC } from '../utils/formatBTC';
import { formatCurrency } from '../utils/formatCurrency';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]); // default 25
  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginated = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice((page - 1) * pageSize, page * pageSize);

  // Calculate minHeight for tbody: rowHeight * pageSize
  const rowHeight = 44; // px, adjust if needed
  const minTableHeight = rowHeight * pageSize;

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Bitcoin size={64} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No transactions yet</h3>
        <p className="text-gray-500">
          Upload your CSV files to start tracking your Bitcoin purchases
        </p>
      </div>
    );
  }

  return (
    <div className="card-base p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Transaction History
      </h2>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <span className="text-xs sm:text-sm text-theme-secondary">
          Rows per page:
          <select
            className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </span>
        <span className="text-xs sm:text-sm text-theme-secondary">
          Page {page} of {totalPages} ({transactions.length} total)
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="text-left py-2 w-24 text-theme-primary">Date</th>
              <th className="text-left py-2 w-32 text-theme-primary">Exchange</th>
              <th className="text-right py-2 w-24 text-theme-primary">USD Amount</th>
              <th className="text-right py-2 w-28 text-theme-primary">BTC Amount</th>
              <th className="text-right py-2 w-20 text-theme-primary">Price</th>
            </tr>
          </thead>
          <tbody style={{ minHeight: minTableHeight, display: 'block', width: '100%' }}>
            {paginated.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}
              >
                <td className="py-2 w-24 text-theme-primary">{tx.date.toLocaleDateString()}</td>
                <td className="py-2 w-32">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      tx.exchange === 'Strike'
                        ? 'bg-orange-100 text-orange-800'
                        : tx.exchange === 'Coinbase'
                          ? 'bg-blue-100 text-blue-800'
                          : tx.exchange === 'Kraken'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tx.exchange}
                  </span>
                </td>
                <td className="text-right py-2 w-24 text-theme-primary">
                  {formatCurrency(tx.usdAmount)}
                </td>
                <td className="text-right py-2 w-28 text-theme-primary">
                  {formatBTC(tx.btcAmount)}
                </td>
                <td className="text-right py-2 w-20 text-theme-primary">
                  {formatCurrency(tx.price)}
                </td>
              </tr>
            ))}
            {/* Fill empty rows to keep height consistent */}
            {Array.from({ length: pageSize - paginated.length }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: rowHeight, display: 'table', width: '100%' }}>
                <td colSpan={5} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {paginated.map((tx) => (
          <div
            key={tx.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-theme-primary">
                {tx.date.toLocaleDateString()}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  tx.exchange === 'Strike'
                    ? 'bg-orange-100 text-orange-800'
                    : tx.exchange === 'Coinbase'
                      ? 'bg-blue-100 text-blue-800'
                      : tx.exchange === 'Kraken'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {tx.exchange}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-theme-secondary">USD:</span>
                <span className="ml-1 font-medium text-theme-primary">
                  {formatCurrency(tx.usdAmount)}
                </span>
              </div>
              <div>
                <span className="text-theme-secondary">BTC:</span>
                <span className="ml-1 font-medium text-theme-primary">
                  {formatBTC(tx.btcAmount)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-theme-secondary">Price:</span>
                <span className="ml-1 font-medium text-theme-primary">
                  {formatCurrency(tx.price)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Fill space for consistent height in mobile view */}
        {Array.from({ length: pageSize - paginated.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{ height: '76px' }} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center sm:justify-end mt-4">
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-theme-primary hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-sm transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-theme-primary hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-sm transition-colors"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TransactionHistory);
