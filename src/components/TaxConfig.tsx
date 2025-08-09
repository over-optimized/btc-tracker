/**
 * Tax Configuration Component
 * Allows users to configure tax calculation settings including method, year, and advanced options
 */

import { useState } from 'react';
import { Calculator, Calendar, Settings, Info } from 'lucide-react';
import { TaxMethod, TaxConfiguration } from '../types/TaxTypes';

interface TaxConfigProps {
  configuration: TaxConfiguration;
  onConfigChange: (config: TaxConfiguration) => void;
  onGenerate: () => void;
  loading?: boolean;
}

const TaxConfig: React.FC<TaxConfigProps> = ({
  configuration,
  onConfigChange,
  onGenerate,
  loading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: currentYear - 2019 },
    (_, i) => currentYear - i
  );

  const taxMethods = [
    {
      value: TaxMethod.FIFO,
      label: 'FIFO (First In, First Out)',
      description: 'Uses oldest Bitcoin purchases first. Most common method.',
      recommended: true,
    },
    {
      value: TaxMethod.LIFO,
      label: 'LIFO (Last In, First Out)',
      description: 'Uses newest Bitcoin purchases first. May reduce gains in bull markets.',
      recommended: false,
    },
    {
      value: TaxMethod.HIFO,
      label: 'HIFO (Highest In, First Out)',
      description: 'Uses highest cost Bitcoin first. Optimizes for tax loss harvesting.',
      recommended: false,
    },
    {
      value: TaxMethod.SPECIFIC_ID,
      label: 'Specific Identification',
      description: 'Manual selection of specific lots (Advanced feature).',
      recommended: false,
    },
  ];

  const handleMethodChange = (method: TaxMethod) => {
    onConfigChange({ ...configuration, method });
  };

  const handleYearChange = (year: number) => {
    onConfigChange({ ...configuration, taxYear: year });
  };

  const handleAdvancedChange = (field: keyof TaxConfiguration, value: any) => {
    onConfigChange({ ...configuration, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="text-purple-500" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Tax Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Method Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Tax Calculation Method
          </h3>
          <div className="space-y-3">
            {taxMethods.map((method) => (
              <label
                key={method.value}
                className={`
                  flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                  ${
                    configuration.method === method.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="taxMethod"
                  value={method.value}
                  checked={configuration.method === method.value}
                  onChange={() => handleMethodChange(method.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {method.label}
                    </span>
                    {method.recommended && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tax Year and Basic Settings */}
        <div className="space-y-6">
          {/* Tax Year Selection */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <Calendar className="text-purple-500" size={20} />
              Tax Year
            </label>
            <select
              value={configuration.taxYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-1">
              Select the tax year for report generation
            </p>
          </div>

          {/* Advanced Settings Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <Settings size={16} />
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Long-term Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Long-term Holding Period (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="730"
                    value={configuration.longTermThresholdDays}
                    onChange={(e) =>
                      handleAdvancedChange(
                        'longTermThresholdDays',
                        parseInt(e.target.value) || 365
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Default: 365 days (IRS standard)
                  </p>
                </div>

                {/* Display Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configuration.showDetailedLots}
                      onChange={(e) =>
                        handleAdvancedChange('showDetailedLots', e.target.checked)
                      }
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Show detailed lot information
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configuration.roundToCents}
                      onChange={(e) =>
                        handleAdvancedChange('roundToCents', e.target.checked)
                      }
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Round currency values to cents
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configuration.includePreviousYears}
                      onChange={(e) =>
                        handleAdvancedChange('includePreviousYears', e.target.checked)
                      }
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Include previous year carryovers
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Generate Report Button */}
          <div className="pt-4">
            <button
              onClick={onGenerate}
              disabled={loading}
              className={`
                w-full px-6 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2
                ${
                  loading
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Calculator size={16} />
                  Generate Tax Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="text-blue-500 mt-1" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tax Calculation Disclaimer</p>
            <p>
              This tool provides estimates for informational purposes only. Tax laws are complex and vary by jurisdiction. 
              Always consult with a qualified tax professional before making tax-related decisions or filing returns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxConfig;