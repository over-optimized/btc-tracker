/**
 * Tax Summary Card Component
 * Shows a summary of tax information on the main dashboard
 */

import { useEffect, useState } from 'react';
import { Calculator, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TaxCalculator } from '../utils/taxCalculator';
import { TaxConfiguration, TaxMethod } from '../types/TaxTypes';
import { Transaction } from '../types/Transaction';
import { formatCurrency } from '../utils/formatCurrency';

interface TaxSummaryCardProps {
  transactions: Transaction[];
}

const TaxSummaryCard: React.FC<TaxSummaryCardProps> = ({ transactions }) => {

  const [taxSummary, setTaxSummary] = useState<{
    currentYearTransactions: number;
    potentialGains: number;
    unrealizedGains: number;
    taxYear: number;
  } | null>(null);

  useEffect(() => {
    if (transactions.length === 0) {
      setTaxSummary(null);
      return;
    }

    try {
      const currentYear = new Date().getFullYear() - 1; // Previous year for tax purposes
      
      // Create basic configuration for summary
      const config: TaxConfiguration = {
        method: TaxMethod.FIFO,
        taxYear: currentYear,
        longTermThresholdDays: 365,
        includePreviousYears: false,
        showDetailedLots: false,
        roundToCents: true,
      };

      const calculator = new TaxCalculator(config);
      const validation = calculator.processTransactions(transactions);

      if (validation.isValid) {
        const report = calculator.generateTaxReport();
        const currentYearTransactions = transactions.filter(
          tx => tx.date.getFullYear() === currentYear
        ).length;

        setTaxSummary({
          currentYearTransactions,
          potentialGains: report.summary.netGains,
          unrealizedGains: report.summary.unrealizedGains,
          taxYear: currentYear,
        });
      } else {
        setTaxSummary(null);
      }
    } catch (error) {
      console.warn('Failed to calculate tax summary:', error);
      setTaxSummary(null);
    }
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div 
        className="card-base p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="text-purple-500" size={20} />
          <span className="text-lg font-semibold text-gray-800">Tax Reports</span>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-600 text-sm mb-3">
            Upload transaction data to view tax information
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upload Transactions
          </Link>
        </div>
      </div>
    );
  }

  if (!taxSummary) {
    return (
      <div 
        className="card-base p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="text-purple-500" size={20} />
          <span className="text-lg font-semibold text-gray-800">Tax Reports</span>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="mx-auto mb-3 text-yellow-500" size={32} />
          <p className="text-gray-600 text-sm mb-3">
            Unable to calculate tax summary
          </p>
          <Link
            to="/tax"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText size={16} />
            View Tax Reports
          </Link>
        </div>
      </div>
    );
  }

  const getGainLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className="card-base p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calculator className="text-purple-500" size={20} />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Tax Summary</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{taxSummary.taxYear}</span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-800 dark:text-gray-400">Transactions</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {taxSummary.currentYearTransactions}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-800 dark:text-gray-400">Realized Gains</span>
          <span className={`font-medium ${getGainLossColor(taxSummary.potentialGains)}`}>
            {formatCurrency(taxSummary.potentialGains)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-800 dark:text-gray-400">Unrealized Gains</span>
          <span className={`font-medium ${getGainLossColor(taxSummary.unrealizedGains)}`}>
            {formatCurrency(taxSummary.unrealizedGains)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to="/tax"
          className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
        >
          Generate Report
        </Link>
        <Link
          to="/tax"
          className="px-3 py-2 border border-purple-600 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center"
        >
          <FileText size={16} />
        </Link>
      </div>

      {/* Tax Season Alert */}
      {new Date().getMonth() >= 0 && new Date().getMonth() <= 3 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Tax Season:</strong> Generate your {taxSummary.taxYear} tax report for filing.
        </div>
      )}
    </div>
  );
};

export default TaxSummaryCard;