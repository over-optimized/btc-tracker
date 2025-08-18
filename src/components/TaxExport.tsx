/**
 * Tax Export Component
 * Allows users to download tax reports in multiple formats (CSV, JSON, PDF)
 */

import { useState } from 'react';
import { Download, FileText, Database, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { TaxReport, TaxExportFormat, TaxExportOptions } from '../types/TaxTypes';

interface TaxExportProps {
  report: TaxReport | null;
  disabled?: boolean;
}

const TaxExport: React.FC<TaxExportProps> = ({ report, disabled = false }) => {
  const [exportOptions, setExportOptions] = useState<TaxExportOptions>({
    format: TaxExportFormat.CSV,
    includeDetailedLots: true,
    includeSummaryOnly: false,
    dateFormat: 'MM/DD/YYYY',
    currencyPrecision: 2,
  });
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ format: string; filename: string } | null>(null);

  const exportFormats = [
    {
      value: TaxExportFormat.CSV,
      label: 'CSV (Spreadsheet)',
      description: 'Compatible with Excel, Google Sheets, and most tax software',
      icon: <FileSpreadsheet className="text-green-600" size={20} />,
      recommended: true,
    },
    {
      value: TaxExportFormat.JSON,
      label: 'JSON (Developer)',
      description: 'Complete data export for developers and advanced users',
      icon: <Database className="text-blue-600" size={20} />,
      recommended: false,
    },
    {
      value: TaxExportFormat.TURBOTAX,
      label: 'TurboTax Import',
      description: 'Optimized format for TurboTax software import',
      icon: <FileText className="text-purple-600" size={20} />,
      recommended: false,
    },
  ];

  const generateCSV = (report: TaxReport): string => {
    const lines: string[] = [];

    // Header
    lines.push('Bitcoin DCA Tracker - Tax Report');
    lines.push(`Tax Year: ${report.taxYear}`);
    lines.push(`Method: ${report.method}`);
    lines.push(`Generated: ${report.generatedAt.toLocaleDateString()}`);
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('Description,Amount');
    lines.push(`Total Gains,${report.summary.totalGains.toFixed(exportOptions.currencyPrecision)}`);
    lines.push(
      `Total Losses,${report.summary.totalLosses.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(`Net Gains,${report.summary.netGains.toFixed(exportOptions.currencyPrecision)}`);
    lines.push(
      `Short-term Gains,${report.summary.shortTermGains.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(
      `Long-term Gains,${report.summary.longTermGains.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(
      `Short-term Losses,${report.summary.shortTermLosses.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(
      `Long-term Losses,${report.summary.longTermLosses.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(`Remaining BTC,${report.summary.remainingBtc.toFixed(8)}`);
    lines.push(
      `Remaining Cost Basis,${report.summary.remainingCostBasis.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push(
      `Unrealized Gains,${report.summary.unrealizedGains.toFixed(exportOptions.currencyPrecision)}`,
    );
    lines.push('');

    if (!exportOptions.includeSummaryOnly) {
      // Disposals
      if (report.disposals.length > 0) {
        lines.push('DISPOSALS');
        lines.push('Date,BTC Amount,Proceeds,Cost Basis,Capital Gain/Loss,Holding Period,Exchange');

        report.disposals.forEach((disposal) => {
          const date = disposal.date.toLocaleDateString();
          const btcAmount = disposal.btcAmount.toFixed(8);
          const proceeds = disposal.usdValue.toFixed(exportOptions.currencyPrecision);
          const costBasis = (disposal.costBasis || 0).toFixed(exportOptions.currencyPrecision);
          const capitalGain = (disposal.capitalGain || 0).toFixed(exportOptions.currencyPrecision);
          const holdingPeriod = disposal.holdingPeriod || 'SHORT_TERM';
          const exchange = disposal.exchange || '';

          lines.push(
            `${date},${btcAmount},${proceeds},${costBasis},${capitalGain},${holdingPeriod},${exchange}`,
          );
        });
        lines.push('');
      }

      // Acquisitions
      lines.push('ACQUISITIONS');
      lines.push('Date,BTC Amount,USD Amount,Price per BTC,Exchange,Transaction ID');

      report.acquisitions.forEach((acquisition) => {
        const date = acquisition.date.toLocaleDateString();
        const btcAmount = acquisition.btcAmount.toFixed(8);
        const usdAmount = acquisition.usdValue.toFixed(exportOptions.currencyPrecision);
        const pricePerBtc = (acquisition.usdValue / acquisition.btcAmount).toFixed(
          exportOptions.currencyPrecision,
        );
        const exchange = acquisition.exchange || '';
        const txId = acquisition.transactionId || '';

        lines.push(`${date},${btcAmount},${usdAmount},${pricePerBtc},${exchange},${txId}`);
      });
      lines.push('');

      // Remaining Lots (if detailed)
      if (exportOptions.includeDetailedLots && report.remainingLots.length > 0) {
        lines.push('REMAINING TAX LOTS');
        lines.push('Purchase Date,Original BTC,Remaining BTC,Cost Basis,Price per BTC,Exchange');

        report.remainingLots.forEach((lot) => {
          const date = lot.purchaseDate.toLocaleDateString();
          const originalBtc = lot.btcAmount.toFixed(8);
          const remainingBtc = lot.remaining.toFixed(8);
          const costBasis = ((lot.remaining / lot.btcAmount) * lot.costBasis).toFixed(
            exportOptions.currencyPrecision,
          );
          const pricePerBtc = lot.pricePerBtc.toFixed(exportOptions.currencyPrecision);
          const exchange = lot.exchange;

          lines.push(
            `${date},${originalBtc},${remainingBtc},${costBasis},${pricePerBtc},${exchange}`,
          );
        });
      }
    }

    return lines.join('\n');
  };

  const generateTurboTaxCSV = (report: TaxReport): string => {
    const lines: string[] = [];

    // TurboTax compatible header
    lines.push(
      'Description,Date Acquired,Date Sold,Sales Price,Cost or Other Basis,Gain or Loss,Type',
    );

    report.disposals.forEach((disposal) => {
      // For TurboTax, we need to create entries for each disposed lot
      disposal.disposedLots?.forEach((disposedLot) => {
        const description = `Bitcoin (BTC)`;
        const dateAcquired = disposedLot.purchaseDate.toLocaleDateString();
        const dateSold = disposal.date.toLocaleDateString();
        const salesPrice = (
          disposedLot.btcAmount *
          (disposal.usdValue / disposal.btcAmount)
        ).toFixed(2);
        const costBasis = disposedLot.costBasis.toFixed(2);
        const gainLoss = (parseFloat(salesPrice) - disposedLot.costBasis).toFixed(2);
        const type = disposedLot.holdingPeriod === 'LONG_TERM' ? 'Long-term' : 'Short-term';

        lines.push(
          `${description},${dateAcquired},${dateSold},${salesPrice},${costBasis},${gainLoss},${type}`,
        );
      });
    });

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!report) return;

    setExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `btc-tax-report-${report.taxYear}-${report.method.toLowerCase()}-${timestamp}`;

      switch (exportOptions.format) {
        case TaxExportFormat.CSV:
          content = generateCSV(report);
          filename = `${baseFilename}.csv`;
          mimeType = 'text/csv';
          break;

        case TaxExportFormat.TURBOTAX:
          content = generateTurboTaxCSV(report);
          filename = `${baseFilename}-turbotax.csv`;
          mimeType = 'text/csv';
          break;

        case TaxExportFormat.JSON:
          content = JSON.stringify(
            {
              report,
              exportOptions,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          );
          filename = `${baseFilename}.json`;
          mimeType = 'application/json';
          break;

        default:
          throw new Error('Unsupported export format');
      }

      downloadFile(content, filename, mimeType);
      setLastExport({ format: exportOptions.format, filename });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const updateOption = <K extends keyof TaxExportOptions>(key: K, value: TaxExportOptions[K]) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  if (!report) {
    return (
      <div className="card-base rounded-lg shadow-lg p-6">
        <div className="text-center text-theme-secondary">
          <Download size={48} className="mx-auto mb-4 text-theme-tertiary" />
          <h3 className="text-lg font-semibold mb-2 text-theme-primary">Export Tax Report</h3>
          <p>Generate a tax report first to enable export functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="text-indigo-500" size={24} />
        <h2 className="text-xl font-bold text-theme-primary">Export Tax Report</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Export Format</h3>
          <div className="space-y-3">
            {exportFormats.map((format) => (
              <label
                key={format.value}
                className={`
                  flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                  ${
                    exportOptions.format === format.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportOptions.format === format.value}
                  onChange={() => updateOption('format', format.value)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {format.icon}
                    <span className="font-medium text-theme-primary">{format.label}</span>
                    {format.recommended && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-theme-secondary mt-1">{format.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Export Options</h3>

          <div className="space-y-4">
            {/* Content Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSummaryOnly}
                  onChange={(e) => updateOption('includeSummaryOnly', e.target.checked)}
                  className="text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <span className="text-sm text-theme-secondary">
                  Summary only (no transaction details)
                </span>
              </label>

              {!exportOptions.includeSummaryOnly && (
                <label className="flex items-center gap-2 ml-6">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDetailedLots}
                    onChange={(e) => updateOption('includeDetailedLots', e.target.checked)}
                    className="text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-theme-secondary">
                    Include remaining tax lot details
                  </span>
                </label>
              )}
            </div>

            {/* Formatting Options */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Currency Precision
              </label>
              <select
                value={exportOptions.currencyPrecision}
                onChange={(e) => updateOption('currencyPrecision', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={0}>Whole dollars ($1234)</option>
                <option value={2}>Cents ($1234.56)</option>
                <option value={4}>High precision ($1234.5678)</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6">
            <button
              onClick={handleExport}
              disabled={disabled || exporting}
              className={`
                w-full px-6 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2
                ${
                  disabled || exporting
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }
              `}
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export Report
                </>
              )}
            </button>
          </div>

          {/* Success Message */}
          {lastExport && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-green-800 dark:text-green-200 text-sm">
                  Successfully exported as <strong>{lastExport.filename}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h4 className="font-medium text-theme-primary mb-2">Export Preview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-theme-secondary">
          <div>
            <span className="font-medium">Tax Year:</span> {report.taxYear}
          </div>
          <div>
            <span className="font-medium">Method:</span> {report.method}
          </div>
          <div>
            <span className="font-medium">Acquisitions:</span> {report.acquisitions.length}
          </div>
          <div>
            <span className="font-medium">Disposals:</span> {report.disposals.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxExport;
