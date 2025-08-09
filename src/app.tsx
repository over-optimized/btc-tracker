import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { fetchBitcoinPrice } from './apis/fetchBitcoinPrice';
import AdditionalCharts from './components/AdditionalCharts';
import DashboardOverview from './components/DashboardOverview';
import ImportErrorModal from './components/ImportErrorModal';
import ImportSummaryModal from './components/ImportSummaryModal';
import InvestedVsPnLChart from './components/InvestedVsPnLChart';
import NavBar from './components/NavBar';
import PortfolioValueChart from './components/PortfolioValueChart';
import TaxDashboard from './components/TaxDashboard';
import TaxSummaryCard from './components/TaxSummaryCard';
import TransactionHistory from './components/TransactionHistory';
import UploadTransactions from './components/UploadTransactions';
import { Stats } from './types/Stats';
import { Transaction } from './types/Transaction';
import { ImportError, ErrorRecoveryContext } from './types/ImportError';
import { processCSVFile, ProcessOptions } from './utils/csvProcessor';
import { generateRecoveryOptions, exportProblematicRows, showHelpModal } from './utils/errorRecovery';
import { formatCurrency } from './utils/formatCurrency';
import { clearTransactions, getTransactions, saveTransactions } from './utils/storage';

const BitcoinTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions().transactions);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState<Stats>({
    totalInvested: 0,
    totalBitcoin: 0,
    avgCostBasis: 0,
    currentValue: 0,
    unrealizedPnL: 0,
  });
  
  // Import result states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [importSummary, setImportSummary] = useState('');
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importWarnings, setImportWarnings] = useState<ImportError[]>([]);
  const [recoveryContext, setRecoveryContext] = useState<ErrorRecoveryContext>();
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

  // Enhanced file upload with comprehensive error handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);

    const options: ProcessOptions = {
      allowPartialImport: true,
      skipInvalidRows: true,
      maxErrors: 50,
      progressCallback: setUploadProgress,
    };

    try {
      const result = await processCSVFile(file, options);
      
      setLoading(false);
      setUploadProgress(100);

      if (result.success && result.importedCount > 0) {
        // Success - merge with existing transactions
        const newTransactions = (result as any).transactions || [];
        const txMap = new Map<string, Transaction>();
        
        // Add existing transactions
        transactions.forEach((tx) => txMap.set(tx.id, tx));
        
        // Add new transactions (deduplication handled by stable IDs)
        let ignored = 0;
        newTransactions.forEach((tx: Transaction) => {
          if (txMap.has(tx.id)) {
            ignored++;
          }
          txMap.set(tx.id, tx);
        });
        
        const merged = Array.from(txMap.values());
        setTransactions(merged);
        saveTransactions(merged);

        // Set results for summary modal
        setImportedCount(result.importedCount);
        setIgnoredCount(ignored + result.ignoredCount);
        setImportSummary(result.summary);
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        setImportModalOpen(true);

        // Navigate to dashboard
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        // Failed or no transactions imported
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        
        if (result.recoveryContext) {
          // Generate recovery options
          const contextData = {
            fileName: file.name,
            fileSize: file.size,
            detectedFormat: result.recoveryContext.detectedFormat,
            processedData: result.recoveryContext.processedData,
          };
          
          const recoveryOptions = generateRecoveryOptions(
            result.errors, 
            result.warnings, 
            contextData
          );
          
          setRecoveryContext({
            ...result.recoveryContext,
            recoveryOptions,
          });
        }
        
        setErrorModalOpen(true);
      }
    } catch (error) {
      setLoading(false);
      setImportErrors([{
        type: 'FILE_READ_ERROR' as any,
        message: 'Unexpected error during file processing',
        details: String(error),
        suggestions: ['Try again with a different file', 'Contact support if error persists'],
        recoverable: false,
      }]);
      setErrorModalOpen(true);
    }
  };

  // Handle retry with recovery options
  const handleRetry = (retryOptions: any) => {
    setErrorModalOpen(false);
    // Create a synthetic file input event for retry
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput?.files?.[0]) {
      // We need to re-process with new options
      const file = fileInput.files[0];
      retryFileUpload(file, retryOptions);
    }
  };

  const retryFileUpload = async (file: File, retryOptions: any) => {
    setLoading(true);
    setUploadProgress(0);

    const options: ProcessOptions = {
      allowPartialImport: true,
      skipInvalidRows: true,
      maxErrors: 50,
      progressCallback: setUploadProgress,
      ...retryOptions,
    };

    try {
      const result = await processCSVFile(file, options);
      
      setLoading(false);
      setUploadProgress(100);

      // Handle results same as main upload
      if (result.success && result.importedCount > 0) {
        const newTransactions = (result as any).transactions || [];
        const txMap = new Map<string, Transaction>();
        
        transactions.forEach((tx) => txMap.set(tx.id, tx));
        
        let ignored = 0;
        newTransactions.forEach((tx: Transaction) => {
          if (txMap.has(tx.id)) {
            ignored++;
          }
          txMap.set(tx.id, tx);
        });
        
        const merged = Array.from(txMap.values());
        setTransactions(merged);
        saveTransactions(merged);

        setImportedCount(result.importedCount);
        setIgnoredCount(ignored + result.ignoredCount);
        setImportSummary(result.summary);
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        setImportModalOpen(true);

        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        setErrorModalOpen(true);
      }
    } catch (error) {
      setLoading(false);
      setImportErrors([{
        type: 'FILE_READ_ERROR' as any,
        message: 'Retry failed',
        details: String(error),
        suggestions: ['Contact support'],
        recoverable: false,
      }]);
      setErrorModalOpen(true);
    }
  };

  // Handle error export
  const handleExportErrors = (data: any) => {
    exportProblematicRows(data, `errors-${Date.now()}.csv`);
  };

  // Handle showing error details
  const handleViewErrorDetails = () => {
    setImportModalOpen(false);
    setErrorModalOpen(true);
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
                errors={importErrors}
                warnings={importWarnings}
                onViewDetails={handleViewErrorDetails}
              />
              <ImportErrorModal
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                errors={importErrors}
                warnings={importWarnings}
                recoveryContext={recoveryContext}
                onRetry={handleRetry}
                onExportErrors={handleExportErrors}
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
                {transactions.length > 0 && <DashboardOverview stats={stats} />}
                
                {/* Tax Summary Card */}
                <div className="mb-6">
                  <TaxSummaryCard transactions={transactions} />
                </div>
                
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
                <TransactionHistory transactions={transactions} />
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
        <Route
          path="/tax"
          element={<TaxDashboard transactions={transactions} currentPrice={currentPrice || undefined} />}
        />
      </Routes>
    </>
  );
};

export default BitcoinTracker;
