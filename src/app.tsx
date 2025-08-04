import { TrendingUp } from 'lucide-react';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { fetchBitcoinPrice } from './apis/fetchBitcoinPrice';
import AdditionalCharts from './components/AdditionalCharts';
import DashboardOverview from './components/DashboardOverview';
import ImportSummaryModal from './components/ImportSummaryModal';
import InvestedVsPnLChart from './components/InvestedVsPnLChart';
import NavBar from './components/NavBar';
import PortfolioValueChart from './components/PortfolioValueChart';
import TransactionHistory from './components/TransactionHistory';
import UploadTransactions from './components/UploadTransactions';
import { Stats } from './types/Stats';
import { Transaction } from './types/Transaction';
import { exchangeParsers } from './utils/exchangeParsers';
import { clearTransactions, getTransactions, saveTransactions } from './utils/storage';

const BitcoinTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalInvested: 0,
    totalBitcoin: 0,
    avgCostBasis: 0,
    currentValue: 0,
    unrealizedPnL: 0,
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [importSummary, setImportSummary] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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

          // Deduplicate by transaction id (latest wins)
          const txMap = new Map<string, Transaction>();
          transactions.forEach((tx) => txMap.set(tx.id, tx));
          let ignored = 0;
          newTransactions.forEach((tx) => {
            if (txMap.has(tx.id)) {
              ignored++;
            }
            txMap.set(tx.id, tx);
          });
          const merged = Array.from(txMap.values());
          const actuallyImported = newTransactions.length - ignored;

          setTransactions(merged);
          saveTransactions(merged);

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

          setImportedCount(actuallyImported);
          setIgnoredCount(ignored);
          setImportSummary(summary);
          setImportModalOpen(true);
          // Navigate to dashboard if not already there
          if (location.pathname !== '/') {
            navigate('/');
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
      clearTransactions();
    }
  };

  return (
    <>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
              <ImportSummaryModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                importedCount={importedCount}
                ignoredCount={ignoredCount}
                summary={importSummary}
              />
              <div className="max-w-6xl mx-auto">
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
                {transactions.length > 0 && (
                  <DashboardOverview
                    stats={stats}
                    formatCurrency={formatCurrency}
                    formatBTC={formatBTC}
                  />
                )}
                {/* Chart placeholder here */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Portfolio Value Over Time
                  </h2>
                  <PortfolioValueChart transactions={transactions} currentPrice={currentPrice} />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Invested vs. Unrealized P&L (Monthly)
                  </h2>
                  <InvestedVsPnLChart transactions={transactions} currentPrice={currentPrice} />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/transactions"
          element={
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
              <div className="max-w-6xl mx-auto">
                <TransactionHistory
                  transactions={transactions}
                  formatCurrency={formatCurrency}
                  formatBTC={formatBTC}
                />
              </div>
            </div>
          }
        />
        <Route
          path="/upload"
          element={
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
              <div className="max-w-6xl mx-auto">
                <UploadTransactions
                  onUpload={handleFileUpload}
                  loading={loading}
                  transactionsCount={transactions.length}
                  clearData={clearData}
                />
              </div>
            </div>
          }
        />
        <Route
          path="/charts"
          element={
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
              <div className="max-w-6xl mx-auto">
                <AdditionalCharts transactions={transactions} currentPrice={currentPrice} />
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default BitcoinTracker;
