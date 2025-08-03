import { Bitcoin } from 'lucide-react';
import React from 'react';
import { Transaction } from '../types/Transaction';

interface TransactionHistoryProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  formatBTC: (amount: number) => string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  formatCurrency,
  formatBTC,
}) => {
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
            {transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 50)
              .map((tx) => (
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
        {transactions.length > 50 && (
          <p className="text-center text-gray-500 mt-4">
            Showing last 50 transactions of {transactions.length} total
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
