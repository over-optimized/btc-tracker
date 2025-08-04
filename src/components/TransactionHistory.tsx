import { Bitcoin } from 'lucide-react';
import React, { useState } from 'react';
import { Transaction } from '../types/Transaction';

interface TransactionHistoryProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  formatBTC: (amount: number) => string;
}

const PAGE_SIZE = 10;

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  formatCurrency,
  formatBTC,
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginated = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Exchange</th>
              <th className="text-right py-2">USD Amount</th>
              <th className="text-right py-2">BTC Amount</th>
              <th className="text-right py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-gray-50">
                <td className="py-2">{tx.date.toLocaleDateString()}</td>
                <td className="py-2">
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
                <td className="text-right py-2">{formatCurrency(tx.usdAmount)}</td>
                <td className="text-right py-2">{formatBTC(tx.btcAmount)}</td>
                <td className="text-right py-2">{formatCurrency(tx.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages} ({transactions.length} total)
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
