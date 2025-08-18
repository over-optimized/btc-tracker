/**
 * Tax Dashboard Component
 * Main tax reporting page that combines configuration and report display
 */

import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle } from 'lucide-react';
import { TaxCalculator } from '../utils/taxCalculator';
import { TaxConfiguration, TaxMethod, TaxReport as TaxReportType } from '../types/TaxTypes';
import { Transaction } from '../types/Transaction';
import TaxConfig from './TaxConfig';
import TaxExport from './TaxExport';
import TaxOptimization from './TaxOptimization';
import TaxReport from './TaxReport';

interface TaxDashboardProps {
  transactions: Transaction[];
  currentPrice?: number;
}

const TaxDashboard: React.FC<TaxDashboardProps> = ({ transactions, currentPrice }) => {
  const [configuration, setConfiguration] = useState<TaxConfiguration>(() => {
    // Load saved configuration from localStorage or use defaults
    const saved = localStorage.getItem('btc-tracker-tax-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load saved tax configuration:', error);
      }
    }

    // Default configuration
    return {
      method: TaxMethod.FIFO,
      taxYear: new Date().getFullYear() - 1, // Default to previous year
      longTermThresholdDays: 365,
      includePreviousYears: false,
      showDetailedLots: true,
      roundToCents: true,
    };
  });

  const [report, setReport] = useState<TaxReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('btc-tracker-tax-config', JSON.stringify(configuration));
    } catch (error) {
      console.warn('Failed to save tax configuration:', error);
    }
  }, [configuration]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create tax calculator with current configuration
      const calculator = new TaxCalculator(configuration);

      // Process transactions
      const validation = calculator.processTransactions(transactions);

      if (!validation.isValid) {
        setError(`Tax calculation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
        setLoading(false);
        return;
      }

      // Generate report
      const taxReport = calculator.generateTaxReport();

      // Add validation warnings to report
      if (validation.warnings.length > 0) {
        taxReport.warnings = [...taxReport.warnings, ...validation.warnings.map((w) => w.message)];
      }

      setReport(taxReport);
    } catch (error) {
      setError(
        `Failed to generate tax report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig: TaxConfiguration) => {
    setConfiguration(newConfig);
    // Clear existing report when configuration changes
    if (report) {
      setReport(null);
    }
  };

  const transactionsForYear = transactions.filter((tx) => {
    const txYear = tx.date.getFullYear();
    return txYear === configuration.taxYear;
  });

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-theme-primary">Tax Reports</h1>
          </div>
          <p className="text-theme-secondary">
            Generate comprehensive tax reports for your Bitcoin DCA transactions
          </p>
        </div>

        {/* Transaction Count Alert */}
        {transactions.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                No Transactions Found
              </span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Upload your transaction data first to generate tax reports. Go to the Upload section
              to import your CSV files.
            </p>
          </div>
        ) : transactionsForYear.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                No Transactions for {configuration.taxYear}
              </span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              No transactions found for the selected tax year. You have {transactions.length}{' '}
              transactions total - try selecting a different year or check your transaction dates.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Calculator className="text-green-600" size={20} />
              <span className="font-medium text-green-800 dark:text-green-200">
                Ready for Tax Calculation
              </span>
            </div>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Found {transactionsForYear.length} transactions for {configuration.taxYear}. Configure
              your settings below and generate your tax report.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <span className="font-medium text-red-800 dark:text-red-200">Error</span>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Tax Configuration */}
        <TaxConfig
          configuration={configuration}
          onConfigChange={handleConfigChange}
          onGenerate={generateReport}
          loading={loading}
        />

        {/* Tax Report */}
        <TaxReport report={report} loading={loading} />

        {/* Tax Optimization */}
        {transactions.length > 0 && (
          <TaxOptimization
            transactions={transactions}
            configuration={configuration}
            currentPrice={currentPrice}
          />
        )}

        {/* Tax Export */}
        <TaxExport report={report} disabled={loading || !report} />

        {/* Report Summary for Quick Reference */}
        {report && !loading && (
          <div className="mt-8 card-base p-6">
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Quick Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-theme-secondary">Tax Year:</span>
                <span className="ml-2 font-medium">{report.taxYear}</span>
              </div>
              <div>
                <span className="text-theme-secondary">Method:</span>
                <span className="ml-2 font-medium">{report.method}</span>
              </div>
              <div>
                <span className="text-theme-secondary">Total Transactions:</span>
                <span className="ml-2 font-medium">{report.totalTransactions}</span>
              </div>
              <div>
                <span className="text-theme-secondary">Net Gains/Losses:</span>
                <span
                  className={`ml-2 font-medium ${
                    report.summary.netGains >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {report.summary.netGains >= 0 ? '+' : ''}${report.summary.netGains.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-theme-secondary">Remaining BTC:</span>
                <span className="ml-2 font-medium">₿{report.summary.remainingBtc.toFixed(8)}</span>
              </div>
              <div>
                <span className="text-theme-secondary">Generated:</span>
                <span className="ml-2 font-medium">{report.generatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxDashboard;
