import React from 'react';
import { AlertTriangle, Calendar, CheckCircle, Clock, Upload } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import { analyzeDataFreshness, detectTransactionGaps } from '../utils/dataFreshness';
import { useTheme } from '../contexts/ThemeContext';

interface DataFreshnessCardProps {
  transactions: Transaction[];
  onImportClick?: () => void;
}

const DataFreshnessCard: React.FC<DataFreshnessCardProps> = ({ transactions, onImportClick }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const freshness = analyzeDataFreshness(transactions);
  const gaps = detectTransactionGaps(transactions);

  // Determine card styling based on staleness
  const getCardStyle = () => {
    if (isDark) {
      // Keep dark mode as-is with status colors
      switch (freshness.staleness) {
        case 'fresh':
          return 'bg-green-900/20 border-green-700';
        case 'aging':
          return 'bg-yellow-900/20 border-yellow-700';
        case 'stale':
          return 'bg-orange-900/20 border-orange-700';
        case 'very_stale':
          return 'bg-red-900/20 border-red-700';
        case 'empty':
          return 'bg-blue-900/20 border-blue-700';
        default:
          return 'bg-gray-800 border-gray-700';
      }
    } else {
      // Light mode with softer backgrounds
      switch (freshness.staleness) {
        case 'fresh':
          return 'bg-green-50 border-green-200';
        case 'aging':
          return 'bg-yellow-50 border-yellow-200';
        case 'stale':
          return 'bg-orange-50 border-orange-200';
        case 'very_stale':
          return 'bg-red-50 border-red-200';
        case 'empty':
          return 'bg-blue-50 border-blue-200';
        default:
          return 'bg-gray-50 border-gray-200';
      }
    }
  };

  const getIcon = () => {
    switch (freshness.staleness) {
      case 'fresh':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'aging':
        return <Clock className="text-yellow-500" size={20} />;
      case 'stale':
      case 'very_stale':
        return <AlertTriangle className="text-orange-500" size={20} />;
      case 'empty':
        return <Upload className="text-blue-500" size={20} />;
      default:
        return <Calendar className="text-gray-500" size={20} />;
    }
  };

  const getTextColor = () => {
    switch (freshness.staleness) {
      case 'fresh':
        return 'text-green-700';
      case 'aging':
        return 'text-yellow-700';
      case 'stale':
        return 'text-orange-700';
      case 'very_stale':
        return 'text-red-700';
      case 'empty':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className={`rounded-lg shadow border-2 p-4 ${getCardStyle()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-400">Data Status</span>
        </div>
        {freshness.isStale && onImportClick && (
          <button
            onClick={onImportClick}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
          >
            Import Data
          </button>
        )}
      </div>

      <div className={`text-sm font-medium mb-2 ${getTextColor()}`}>
        {freshness.message}
      </div>

      {freshness.recommendation && (
        <div className="text-xs text-gray-600 mb-3">
          {freshness.recommendation}
        </div>
      )}

      {freshness.lastTransactionDate && (
        <div className="text-xs text-gray-500 mb-2">
          Last transaction: {freshness.lastTransactionDate.toLocaleDateString()}
        </div>
      )}

      {gaps.hasSignificantGaps && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-1">
            Potential gaps detected:
          </div>
          <div className="space-y-1">
            {gaps.gaps.slice(0, 2).map((gap, index) => (
              <div key={index} className="text-xs text-gray-500">
                • {gap.message}
              </div>
            ))}
            {gaps.gaps.length > 2 && (
              <div className="text-xs text-gray-500">
                • +{gaps.gaps.length - 2} more gap{gaps.gaps.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFreshnessCard;