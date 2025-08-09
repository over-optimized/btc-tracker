/**
 * Tax Report Component
 * Displays comprehensive tax calculations including summary cards and detailed tables
 */

import { useState } from 'react';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Building,
  Hash
} from 'lucide-react';
import { TaxReport as TaxReportType, TaxEvent, TaxLot, HoldingPeriod } from '../types/TaxTypes';
import { formatCurrency } from '../utils/formatCurrency';
import { formatBTC } from '../utils/formatBTC';

interface TaxReportProps {
  report: TaxReportType | null;
  loading: boolean;
}

const TaxReport: React.FC<TaxReportProps> = ({ report, loading }) => {
  const [showAcquisitions, setShowAcquisitions] = useState(false);
  const [showDisposals, setShowDisposals] = useState(true);
  const [showRemainingLots, setShowRemainingLots] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
          <span className="text-lg text-gray-600">Generating tax report...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center text-gray-600">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Tax Report Generated</h3>
          <p>Configure your tax settings and click "Generate Tax Report" to get started.</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHoldingPeriod = (period: HoldingPeriod) => {
    return period === HoldingPeriod.LONG_TERM ? 'Long-term' : 'Short-term';
  };

  const getGainLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-purple-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Tax Report - {report.taxYear}
              </h2>
              <p className="text-sm text-gray-600">
                Method: {report.method} | Generated: {formatDate(report.generatedAt)}
              </p>
            </div>
          </div>
          {!report.isComplete && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              Incomplete Data
            </div>
          )}
        </div>

        {/* Warnings and Errors */}
        {(report.warnings.length > 0 || report.errors.length > 0) && (
          <div className="mt-4 space-y-2">
            {report.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-medium text-red-800 mb-1">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {report.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-1">Warnings:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {report.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Total Gains</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(report.summary.totalGains)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            ST: {formatCurrency(report.summary.shortTermGains)} | 
            LT: {formatCurrency(report.summary.longTermGains)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-red-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Total Losses</span>
          </div>
          <span className="text-2xl font-bold text-red-600">
            {formatCurrency(report.summary.totalLosses)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            ST: {formatCurrency(report.summary.shortTermLosses)} | 
            LT: {formatCurrency(report.summary.longTermLosses)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-purple-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Net Gains</span>
          </div>
          <span className={`text-2xl font-bold ${getGainLossColor(report.summary.netGains)}`}>
            {formatCurrency(report.summary.netGains)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {report.summary.totalDisposals} disposals
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Unrealized Gains</span>
          </div>
          <span className={`text-2xl font-bold ${getGainLossColor(report.summary.unrealizedGains)}`}>
            {formatCurrency(report.summary.unrealizedGains)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {formatBTC(report.summary.remainingBtc)} remaining
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      
      {/* Disposals Section */}
      {report.disposals.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <button
              onClick={() => setShowDisposals(!showDisposals)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Disposals ({report.disposals.length})
              </h3>
              {showDisposals ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
          
          {showDisposals && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">BTC Amount</th>
                      <th className="text-left py-2">Proceeds</th>
                      <th className="text-left py-2">Cost Basis</th>
                      <th className="text-left py-2">Capital Gain/Loss</th>
                      <th className="text-left py-2">Holding Period</th>
                      <th className="text-left py-2">Exchange</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.disposals.map((disposal) => (
                      <tr key={disposal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{formatDate(disposal.date)}</td>
                        <td className="py-3">{formatBTC(disposal.btcAmount)}</td>
                        <td className="py-3">{formatCurrency(disposal.usdValue)}</td>
                        <td className="py-3">{formatCurrency(disposal.costBasis || 0)}</td>
                        <td className={`py-3 font-medium ${getGainLossColor(disposal.capitalGain || 0)}`}>
                          {formatCurrency(disposal.capitalGain || 0)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            disposal.holdingPeriod === HoldingPeriod.LONG_TERM 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {formatHoldingPeriod(disposal.holdingPeriod || HoldingPeriod.SHORT_TERM)}
                          </span>
                        </td>
                        <td className="py-3">{disposal.exchange || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acquisitions Section */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <button
            onClick={() => setShowAcquisitions(!showAcquisitions)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Acquisitions ({report.acquisitions.length})
            </h3>
            {showAcquisitions ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
        
        {showAcquisitions && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">BTC Amount</th>
                    <th className="text-left py-2">USD Amount</th>
                    <th className="text-left py-2">Price per BTC</th>
                    <th className="text-left py-2">Exchange</th>
                    <th className="text-left py-2">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {report.acquisitions.map((acquisition) => (
                    <tr key={acquisition.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{formatDate(acquisition.date)}</td>
                      <td className="py-3">{formatBTC(acquisition.btcAmount)}</td>
                      <td className="py-3">{formatCurrency(acquisition.usdValue)}</td>
                      <td className="py-3">{formatCurrency(acquisition.usdValue / acquisition.btcAmount)}</td>
                      <td className="py-3 flex items-center gap-1">
                        <Building size={12} />
                        {acquisition.exchange || 'N/A'}
                      </td>
                      <td className="py-3 flex items-center gap-1 text-gray-600">
                        <Hash size={12} />
                        <span className="font-mono text-xs">
                          {acquisition.transactionId?.slice(-8) || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Remaining Tax Lots */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <button
            onClick={() => setShowRemainingLots(!showRemainingLots)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Remaining Tax Lots ({report.remainingLots.length})
            </h3>
            {showRemainingLots ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
        
        {showRemainingLots && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="text-left py-2">Purchase Date</th>
                    <th className="text-left py-2">Original BTC</th>
                    <th className="text-left py-2">Remaining BTC</th>
                    <th className="text-left py-2">Cost Basis</th>
                    <th className="text-left py-2">Price per BTC</th>
                    <th className="text-left py-2">Exchange</th>
                    <th className="text-left py-2">Age (Days)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.remainingLots.map((lot) => {
                    const ageInDays = Math.floor((Date.now() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                    const isLongTerm = ageInDays > 365;
                    
                    return (
                      <tr key={lot.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{formatDate(lot.purchaseDate)}</td>
                        <td className="py-3">{formatBTC(lot.btcAmount)}</td>
                        <td className="py-3 font-medium">{formatBTC(lot.remaining)}</td>
                        <td className="py-3">{formatCurrency((lot.remaining / lot.btcAmount) * lot.costBasis)}</td>
                        <td className="py-3">{formatCurrency(lot.pricePerBtc)}</td>
                        <td className="py-3">{lot.exchange}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isLongTerm 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ageInDays} ({isLongTerm ? 'LT' : 'ST'})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxReport;