import { Bitcoin, Calculator, DollarSign, FileText, TrendingUp, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { fetchBitcoinPrice } from './apis/fetchBitcoinPrice';
import { Stats } from './types/Stats';
import { Transaction } from './types/Transaction';
import { exchangeParsers } from './utils/exchangeParsers';

const BitcoinTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalInvested: 0,
    totalBitcoin: 0,
    avgCostBasis: 0,
    currentValue: 0,
    unrealizedPnL: 0,
  });

  useEffect(() => {
    (async () => {
      const price = await fetchBitcoinPrice();
      setCurrentPrice(price);
    })();
    // Refresh price every 30 seconds
    const interval = setInterval(fetchBitcoinPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate portfolio stats
  useEffect(() => {
    const totalInvested = transactions.reduce((sum, tx) => sum + tx.usdAmount, 0);
    const totalBitcoin = transactions.reduce((sum, tx) => sum + tx.btcAmount, 0);
    const avgCostBasis = totalBitcoin > 0 ? totalInvested / totalBitcoin : 0;
    const currentValue = currentPrice ? totalBitcoin * currentPrice : 0;
    const unrealizedPnL = currentValue - totalInvested;

    setStats({
      totalInvested,
      totalBitcoin,
      avgCostBasis,
      currentValue,
      unrealizedPnL,
    });
  }, [transactions, currentPrice]);

  // Exchange-specific parsers

  // Detect exchange format and parse accordingly
  const parseTransactionRow = (row: any, index: number): Transaction | null => {
    // Try Strike format first
    if (row['Date & Time (UTC)'] && row['Transaction Type']) {
      return exchangeParsers.strike(row, index);
    }

    // Try Coinbase format
    if (row['Transaction Type'] || row['Timestamp']) {
      const parsed = exchangeParsers.coinbase(row, index);
      if (parsed) return parsed;
    }

    // Try Kraken format
    if (row['type'] && row['pair']) {
      const parsed = exchangeParsers.kraken(row, index);
      if (parsed) return parsed;
    }

    // Fall back to generic parser
    return exchangeParsers.generic(row, index);
  };

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        try {
          const newTransactions = results.data
            .map((row, index) => parseTransactionRow(row, index))
            .filter((tx): tx is Transaction => !!tx && tx.usdAmount > 0 && tx.btcAmount > 0);

          setTransactions((prev) => [...prev, ...newTransactions]);

          // Show parsing summary
          const exchangeCounts = newTransactions.reduce(
            (acc: Record<string, number>, tx) => {
              acc[tx.exchange] = (acc[tx.exchange] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const summary = Object.entries(exchangeCounts)
            .map(([exchange, count]) => `${count} ${exchange}`)
            .join(', ');

          if (newTransactions.length > 0) {
            alert(`Successfully imported ${newTransactions.length} transactions: ${summary}`);
          } else {
            alert('No valid purchase transactions found in the file.');
          }
        } catch (error) {
          alert('Error parsing file. Please check the format and try again.');
        }
        setLoading(false);
      },
      error: (error) => {
        alert('Error reading file: ' + error.message);
        setLoading(false);
      },
    });
  };

  // Helper functions

  const detectExchange = (row: any): string => {
    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('strike')) return 'Strike';
    if (rowStr.includes('coinbase')) return 'Coinbase';
    if (rowStr.includes('kraken')) return 'Kraken';
    return 'Unknown';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatBTC = (amount: number): string => {
    return `₿${amount.toFixed(8)}`;
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all transaction data?')) {
      setTransactions([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Bitcoin className="text-orange-500" size={40} />
            Bitcoin DCA Tracker
          </h1>
          <p className="text-gray-600">
            Track your dollar-cost averaging across multiple exchanges
          </p>
        </div>

        {/* Current Price Display */}
        {currentPrice && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-4">
              <TrendingUp className="text-green-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">
                Bitcoin: {formatCurrency(currentPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Portfolio Stats */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Total Invested</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalInvested)}
              </span>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Bitcoin className="text-orange-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Total Bitcoin</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {formatBTC(stats.totalBitcoin)}
              </span>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="text-purple-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Avg Cost Basis</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.avgCostBasis)}
              </span>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp
                  className={stats.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}
                  size={20}
                />
                <span className="text-sm font-medium text-gray-600">Unrealized P&L</span>
              </div>
              <span
                className={`text-2xl font-bold ${stats.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(stats.unrealizedPnL)}
              </span>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload Transaction Files
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={loading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileText size={48} className="text-gray-400" />
              <span className="text-lg font-medium text-gray-600">
                {loading ? 'Processing...' : 'Upload CSV file'}
              </span>
              <span className="text-sm text-gray-500">
                Supports Strike, Coinbase, and Kraken formats
              </span>
            </label>
          </div>

          {transactions.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {transactions.length} transactions loaded
              </span>
              <button
                onClick={clearData}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear Data
              </button>
            </div>
          )}
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
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
                    .slice(0, 50) // Show last 50 transactions
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
        )}

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <Bitcoin size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No transactions yet</h3>
            <p className="text-gray-500">
              Upload your CSV files to start tracking your Bitcoin purchases
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BitcoinTracker;
