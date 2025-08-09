import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldX, Wallet, AlertTriangle, Info, Plus } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import { analyzeSelfCustody } from '../utils/selfCustodyTracker';
import { formatBTC } from '../utils/formatBTC';
import { formatCurrency } from '../utils/formatCurrency';

interface SelfCustodyCardProps {
  transactions: Transaction[];
  currentPrice?: number;
  onAddWithdrawal?: () => void;
}

const SelfCustodyCard: React.FC<SelfCustodyCardProps> = ({
  transactions,
  currentPrice,
  onAddWithdrawal,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const analysis = analyzeSelfCustody(transactions, currentPrice);

  const getSecurityIcon = () => {
    switch (analysis.overallRisk) {
      case 'low':
        return <Shield className="text-green-500" size={20} />;
      case 'medium':
        return <ShieldAlert className="text-yellow-500" size={20} />;
      case 'high':
      case 'critical':
        return <ShieldX className="text-red-500" size={20} />;
      default:
        return <Shield className="text-gray-500" size={20} />;
    }
  };

  const getCardStyle = () => {
    switch (analysis.overallRisk) {
      case 'low':
        return 'bg-green-50 border-green-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (analysis.overallRisk) {
      case 'low':
        return 'text-green-700';
      case 'medium':
        return 'text-yellow-700';
      case 'high':
        return 'text-orange-700';
      case 'critical':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getRecommendationIcon = (urgency: 'info' | 'warning' | 'urgent') => {
    switch (urgency) {
      case 'info':
        return <Info className="text-blue-500" size={14} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={14} />;
      case 'urgent':
        return <AlertTriangle className="text-red-500" size={14} />;
    }
  };

  if (analysis.totalOnExchanges === 0 && analysis.totalInSelfCustody === 0) {
    return (
      <div className="bg-gray-50 border-gray-200 rounded-lg shadow border-2 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Wallet className="text-gray-500" size={20} />
          <span className="text-sm font-medium text-gray-600">Self-Custody Status</span>
        </div>
        <div className="text-sm text-gray-600">
          Import transactions to see self-custody recommendations
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow border-2 p-4 ${getCardStyle()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getSecurityIcon()}
          <span className="text-sm font-medium text-gray-600">Self-Custody Status</span>
        </div>
        {onAddWithdrawal && (
          <button
            onClick={onAddWithdrawal}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
            title="Record a withdrawal to self-custody"
          >
            <Plus size={12} />
            Add Withdrawal
          </button>
        )}
      </div>

      {/* Security Score */}
      <div className={`text-sm font-medium mb-2 ${getTextColor()}`}>
        Security Score: {analysis.securityScore}/100 ({analysis.overallRisk} risk)
      </div>

      {/* Portfolio Breakdown */}
      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>On Exchanges:</span>
          <span className="font-medium">
            {formatBTC(analysis.totalOnExchanges)}
            {currentPrice && ` (${formatCurrency(analysis.totalOnExchanges * currentPrice)})`}
          </span>
        </div>
        {analysis.totalInSelfCustody > 0 && (
          <div className="flex justify-between">
            <span>Self-Custody:</span>
            <span className="font-medium text-green-600">
              {formatBTC(analysis.totalInSelfCustody)}
              {currentPrice && ` (${formatCurrency(analysis.totalInSelfCustody * currentPrice)})`}
            </span>
          </div>
        )}
      </div>

      {/* Top Recommendation */}
      {analysis.recommendations.length > 0 && (
        <div className="mb-3">
          <div className="flex items-start gap-2">
            {getRecommendationIcon(analysis.recommendations[0].urgency)}
            <div className="text-xs text-gray-700 leading-relaxed">
              {analysis.recommendations[0].message}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Details */}
      {(analysis.recommendations.length > 1 || analysis.exchangeBalances.length > 0) && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showDetails ? 'Hide details' : `Show details (${analysis.recommendations.length} recommendations)`}
          </button>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
              {/* All Recommendations */}
              {analysis.recommendations.length > 1 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">All Recommendations:</div>
                  <div className="space-y-2">
                    {analysis.recommendations.slice(1).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {getRecommendationIcon(rec.urgency)}
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {rec.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exchange Breakdown */}
              {analysis.exchangeBalances.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Exchange Balances:</div>
                  <div className="space-y-1">
                    {analysis.exchangeBalances.map((balance, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{balance.exchange}:</span>
                        <span className={balance.recommendSelfCustody ? 'text-orange-600 font-medium' : 'text-gray-700'}>
                          {formatBTC(balance.btcAmount)}
                          {balance.milestone && (
                            <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1 rounded">
                              {balance.milestone.label}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelfCustodyCard;