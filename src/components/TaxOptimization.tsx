/**
 * Tax Optimization Component
 * Provides tax strategy recommendations and hypothetical disposal calculations
 */

import { useState } from 'react';
import { Lightbulb, Calculator, TrendingDown, AlertCircle, Play, BarChart3 } from 'lucide-react';
import { TaxCalculator } from '../utils/taxCalculator';
import { TaxConfiguration, TaxMethod, HoldingPeriod } from '../types/TaxTypes';
import { Transaction } from '../types/Transaction';
import { formatCurrency } from '../utils/formatCurrency';
import { formatBTC } from '../utils/formatBTC';
import { MediumRiskFeature } from './FeatureFlag';

interface TaxOptimizationProps {
  transactions: Transaction[];
  configuration: TaxConfiguration;
  currentPrice?: number;
}

const TaxOptimization: React.FC<TaxOptimizationProps> = ({
  transactions,
  configuration,
  currentPrice,
}) => {
  const [hypotheticalAmount, setHypotheticalAmount] = useState<string>('');
  const [hypotheticalPrice, setHypotheticalPrice] = useState<string>(
    currentPrice?.toString() || '',
  );
  const [hypotheticalResult, setHypotheticalResult] = useState<{
    capitalGain: number;
    costBasis: number;
    proceeds: number;
    holdingPeriod: HoldingPeriod;
    effectiveTaxRate?: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodComparison, setMethodComparison] = useState<Array<{
    method: string;
    capitalGain: number;
    costBasis: number;
    proceeds: number;
    holdingPeriod: HoldingPeriod;
    effectiveTaxRate?: number;
    error?: string;
  }> | null>(null);

  const calculator = new TaxCalculator(configuration);
  calculator.processTransactions(transactions);

  // Get optimization suggestions
  const suggestions = currentPrice ? calculator.getTaxOptimizationSuggestions(currentPrice) : [];

  const calculateHypothetical = () => {
    const btcAmount = parseFloat(hypotheticalAmount);
    const salePrice = parseFloat(hypotheticalPrice);

    if (isNaN(btcAmount) || isNaN(salePrice) || btcAmount <= 0 || salePrice <= 0) {
      setHypotheticalResult(null);
      return;
    }

    try {
      const result = calculator.calculateHypotheticalDisposal(btcAmount, salePrice);
      setHypotheticalResult(result);
    } catch (error) {
      setHypotheticalResult(null);
    }
  };

  const compareAllMethods = async () => {
    if (!hypotheticalAmount || !hypotheticalPrice) return;

    setLoading(true);
    try {
      const btcAmount = parseFloat(hypotheticalAmount);
      const salePrice = parseFloat(hypotheticalPrice);

      const methods = [TaxMethod.FIFO, TaxMethod.LIFO, TaxMethod.HIFO];
      const comparisons = [];

      for (const method of methods) {
        const methodCalculator = new TaxCalculator({ ...configuration, method });
        methodCalculator.processTransactions(transactions);

        try {
          const result = methodCalculator.calculateHypotheticalDisposal(btcAmount, salePrice);
          comparisons.push({
            method: method.toString(),
            ...result,
          });
        } catch (error) {
          comparisons.push({
            method: method.toString(),
            capitalGain: 0,
            costBasis: 0,
            proceeds: 0,
            holdingPeriod: 'short' as HoldingPeriod,
            error: error instanceof Error ? error.message : 'Calculation failed',
          });
        }
      }

      setMethodComparison(comparisons);
    } finally {
      setLoading(false);
    }
  };

  const getOptimizationIcon = (suggestion: string) => {
    if (suggestion.includes('Tax-loss harvesting'))
      return <TrendingDown className="text-red-500" />;
    if (suggestion.includes('Consider holding')) return <AlertCircle className="text-yellow-500" />;
    if (suggestion.includes('comparing')) return <BarChart3 className="text-blue-500" />;
    return <Lightbulb className="text-green-500" />;
  };

  const getBestMethod = () => {
    if (!methodComparison) return null;

    const validComparisons = methodComparison.filter((comp) => !comp.error);
    if (validComparisons.length === 0) return null;

    // Find method with highest gain (or lowest loss)
    return validComparisons.reduce((best, current) => {
      return current.capitalGain > best.capitalGain ? current : best;
    });
  };

  const remainingBtc = calculator.getLotManager().getTotalRemainingBtc();

  return (
    <MediumRiskFeature
      feature="taxOptimization"
      fallback={
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center text-gray-600 py-8">
            <Calculator size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Tax Optimization</h3>
            <p>Tax optimization tools are available in development mode.</p>
            <p className="text-sm text-gray-500 mt-2">
              These features require legal review before production deployment.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tax Optimization Suggestions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Tax Optimization Suggestions</h2>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <Lightbulb size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
              <p>
                Upload transactions and set a current Bitcoin price to get optimization suggestions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {getOptimizationIcon(suggestion)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hypothetical Sale Calculator */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="text-purple-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Hypothetical Sale Calculator</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitcoin Amount to Sell
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    max={remainingBtc}
                    value={hypotheticalAmount}
                    onChange={(e) => setHypotheticalAmount(e.target.value)}
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.01"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">BTC</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Available: {formatBTC(remainingBtc)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Price per BTC
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hypotheticalPrice}
                    onChange={(e) => setHypotheticalPrice(e.target.value)}
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="50000"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">USD</span>
                </div>
                {currentPrice && (
                  <p className="text-xs text-gray-600 mt-1">
                    Current price: {formatCurrency(currentPrice)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={calculateHypothetical}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Calculate
                </button>

                <button
                  onClick={compareAllMethods}
                  disabled={loading || !hypotheticalAmount || !hypotheticalPrice}
                  className={`
                  flex-1 px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2
                  ${
                    loading || !hypotheticalAmount || !hypotheticalPrice
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Comparing...
                    </>
                  ) : (
                    <>
                      <BarChart3 size={16} />
                      Compare Methods
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div>
              {hypotheticalResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {configuration.method} Method Result
                  </h3>

                  {hypotheticalResult.error ? (
                    <div className="text-red-600 text-sm">{hypotheticalResult.error}</div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proceeds:</span>
                        <span className="font-medium">
                          {formatCurrency(hypotheticalResult.proceeds)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Basis:</span>
                        <span className="font-medium">
                          {formatCurrency(hypotheticalResult.costBasis)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Capital Gain/Loss:</span>
                        <span
                          className={`font-bold ${
                            hypotheticalResult.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(hypotheticalResult.capitalGain)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Holding Period:</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            hypotheticalResult.holdingPeriod === HoldingPeriod.LONG_TERM
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {hypotheticalResult.holdingPeriod === HoldingPeriod.LONG_TERM
                            ? 'Long-term'
                            : 'Short-term'}
                        </span>
                      </div>
                      {hypotheticalResult.effectiveTaxRate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Tax Rate:</span>
                          <span className="font-medium">
                            {(hypotheticalResult.effectiveTaxRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Method Comparison Results */}
        {methodComparison && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Tax Method Comparison</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {methodComparison.map((comparison, index: number) => {
                const isBest = comparison === getBestMethod();

                return (
                  <div
                    key={index}
                    className={`
                    p-4 rounded-lg border-2 relative
                    ${isBest ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}
                  `}
                  >
                    {isBest && (
                      <div className="absolute -top-2 left-4 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Best Option
                      </div>
                    )}

                    <h3 className="font-semibold text-gray-800 mb-3 mt-2">{comparison.method}</h3>

                    {comparison.error ? (
                      <div className="text-red-600 text-sm">{comparison.error}</div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capital Gain:</span>
                          <span
                            className={`font-bold ${
                              comparison.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(comparison.capitalGain)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost Basis:</span>
                          <span className="font-medium">
                            {formatCurrency(comparison.costBasis)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Holding Period:</span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              comparison.holdingPeriod === HoldingPeriod.LONG_TERM
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {comparison.holdingPeriod === HoldingPeriod.LONG_TERM ? 'LT' : 'ST'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {getBestMethod() && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>Recommendation:</strong> The {getBestMethod()!.method} method provides the
                  best tax outcome for this hypothetical sale with a capital gain of{' '}
                  {formatCurrency(getBestMethod()!.capitalGain)}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MediumRiskFeature>
  );
};

export default TaxOptimization;
