import {
  ImportError,
  ImportErrorType,
  ErrorRecoveryContext,
  RecoveryOption,
} from '../types/ImportError';

export function generateRecoveryOptions(
  errors: ImportError[],
  warnings: ImportError[],
  context: {
    fileName?: string;
    fileSize?: number;
    rowCount?: number;
    detectedFormat?: string;
    processedData?: any[];
  },
): RecoveryOption[] {
  const options: RecoveryOption[] = [];
  const errorTypes = new Set(errors.map((e) => e.type));

  // Format-related recovery options
  if (
    errorTypes.has(ImportErrorType.MISSING_REQUIRED_COLUMNS) ||
    errorTypes.has(ImportErrorType.UNSUPPORTED_FORMAT)
  ) {
    options.push({
      id: 'try-generic-format',
      label: 'Try Generic Format',
      description: 'Attempt to parse using flexible column matching',
      action: 'retry',
      data: { forceFormat: 'generic', skipValidation: true },
    });

    if (context.detectedFormat !== 'generic') {
      options.push({
        id: 'force-format',
        label: `Force ${context.detectedFormat || 'Detected'} Format`,
        description: 'Override format detection and try anyway',
        action: 'retry',
        data: {
          forceFormat: context.detectedFormat,
          skipColumnValidation: true,
          allowPartialImport: true,
        },
      });
    }
  }

  // Data validation recovery options
  if (errorTypes.has(ImportErrorType.INVALID_DATA_VALUES)) {
    const recoverableErrors = errors.filter(
      (e) => e.type === ImportErrorType.INVALID_DATA_VALUES && e.recoverable,
    ).length;

    if (recoverableErrors > 0) {
      options.push({
        id: 'skip-invalid-rows',
        label: 'Skip Invalid Rows',
        description: `Import valid data and skip ${recoverableErrors} problematic rows`,
        action: 'retry',
        data: {
          skipInvalidRows: true,
          allowPartialImport: true,
          maxErrors: 100,
        },
      });
    }

    // Suggest data cleaning
    options.push({
      id: 'export-problematic-rows',
      label: 'Export Problem Rows',
      description: 'Download a CSV with only the rows that have issues',
      action: 'export',
      data: {
        exportType: 'problem-rows',
        rows: context.processedData,
        errors: errors.filter((e) => e.rowNumber),
      },
    });
  }

  // File structure issues
  if (errorTypes.has(ImportErrorType.INVALID_CSV_FORMAT)) {
    options.push({
      id: 'csv-help',
      label: 'CSV Format Help',
      description: 'Learn how to fix common CSV formatting issues',
      action: 'modify',
      data: { helpType: 'csv-format' },
    });
  }

  // Empty file or no data
  if (errorTypes.has(ImportErrorType.EMPTY_FILE)) {
    options.push({
      id: 'export-help',
      label: 'Export Guide',
      description: 'Step-by-step guide for exporting from your exchange',
      action: 'modify',
      data: { helpType: 'export-guide', exchange: context.detectedFormat },
    });
  }

  // Large file issues
  if (context.fileSize && context.fileSize > 5 * 1024 * 1024) {
    // > 5MB
    options.push({
      id: 'batch-import',
      label: 'Batch Processing',
      description: 'Process in smaller chunks to avoid timeouts',
      action: 'retry',
      data: { batchSize: 1000, allowPartialImport: true },
    });
  }

  // Always offer manual review
  if (errors.length > 0) {
    options.push({
      id: 'manual-review',
      label: 'Manual Review Guide',
      description: 'Get specific instructions for fixing your data',
      action: 'modify',
      data: {
        helpType: 'manual-review',
        specificErrors: errors.slice(0, 5).map((e) => ({
          type: e.type,
          message: e.message,
          suggestions: e.suggestions?.slice(0, 2) || [],
        })),
      },
    });
  }

  return options;
}

export function createProblematicRowsCSV(originalData: any[], errors: ImportError[]): string {
  if (!originalData || originalData.length === 0) {
    return 'No data available';
  }

  const errorRowNumbers = new Set(
    errors.filter((e) => e.rowNumber).map((e) => e.rowNumber! - 1), // Convert to 0-based index
  );

  const problematicRows = originalData.filter((_, index) => errorRowNumbers.has(index));

  if (problematicRows.length === 0) {
    return 'No problematic rows found';
  }

  // Get all possible columns
  const allColumns = new Set<string>();
  problematicRows.forEach((row) => {
    Object.keys(row).forEach((col) => allColumns.add(col));
  });

  // Add error information columns
  allColumns.add('__ERROR_DETAILS__');
  allColumns.add('__SUGGESTIONS__');

  const headers = Array.from(allColumns);

  // Create CSV content
  const csvRows = problematicRows.map((row, index) => {
    const originalIndex = originalData.indexOf(row);
    const rowErrors = errors.filter((e) => e.rowNumber === originalIndex + 1);

    const csvRow = headers.map((header) => {
      if (header === '__ERROR_DETAILS__') {
        return `"${rowErrors.map((e) => e.message).join('; ')}"`;
      } else if (header === '__SUGGESTIONS__') {
        const suggestions = rowErrors.flatMap((e) => e.suggestions || []).slice(0, 3);
        return `"${suggestions.join('; ')}"`;
      } else {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains commas
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }
    });

    return csvRow.join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

export function generateHelpContent(helpType: string, context?: any): string {
  switch (helpType) {
    case 'csv-format':
      return `
# CSV Format Help

## Common Issues and Solutions:

### 1. File Encoding
- **Problem**: Special characters appear as question marks or boxes
- **Solution**: Save your CSV file using UTF-8 encoding

### 2. Column Headers
- **Problem**: Column names don't match expected format
- **Solution**: Ensure column headers match exactly (case-sensitive):
  - Strike: "Reference", "Date & Time (UTC)", "Transaction Type"
  - Coinbase: "Transaction Type", "Timestamp", "Quantity Transacted"
  - Kraken: "type", "pair", "time", "cost", "vol"

### 3. Date Format
- **Problem**: Dates not recognized
- **Solution**: Use standard date formats:
  - YYYY-MM-DD HH:MM:SS
  - MM/DD/YYYY HH:MM:SS
  - Or your exchange's default export format

### 4. Number Format
- **Problem**: Numbers with currency symbols or commas
- **Solution**: Remove currency symbols ($, €, etc.) and use decimal points (not commas)

## Quick Fixes:
1. Open CSV in Excel or Google Sheets
2. Check column names match exactly
3. Remove any currency symbols from amounts
4. Save as CSV (UTF-8) format
5. Try importing again
      `.trim();

    case 'export-guide': {
      const exchange = context?.exchange || 'your exchange';
      return `
# Export Guide for ${exchange}

## General Steps:
1. Log into your ${exchange} account
2. Navigate to Transaction History or Reports
3. Set date range to include all your Bitcoin purchases
4. Select Bitcoin or BTC transactions only
5. Choose CSV export format
6. Download the file

## What to Include:
- ✅ Purchase/Buy transactions
- ✅ Date and time
- ✅ USD amounts
- ✅ Bitcoin amounts
- ✅ Transaction IDs (if available)
- ❌ Sells, transfers, or other transaction types

## Common Export Issues:
- **Empty file**: Check your date range includes transactions
- **Wrong format**: Look for "Advanced" or "Custom" export options
- **Missing columns**: Try different export templates
      `.trim();
    }

    case 'manual-review': {
      const errors = context?.specificErrors || [];
      let content = '# Manual Review Guide\n\nBased on your specific errors:\n\n';

      errors.forEach((error: any, index: number) => {
        content += `## ${index + 1}. ${error.message}\n`;
        if (error.suggestions) {
          content += 'Suggestions:\n';
          error.suggestions.forEach((suggestion: string) => {
            content += `- ${suggestion}\n`;
          });
        }
        content += '\n';
      });

      content += `
## General Tips:
1. Check your CSV file in Excel or a text editor
2. Verify column names match exactly
3. Ensure all required fields have data
4. Remove any extra rows or columns
5. Save as UTF-8 CSV format

## Still Need Help?
If these suggestions don't resolve your issues:
1. Check the file format matches your exchange
2. Try using the "Generic" format option
3. Consider splitting large files into smaller chunks
      `.trim();

      return content;
    }

    default:
      return 'Help content not available for this topic.';
  }
}

export function exportProblematicRows(data: any, fileName: string = 'problematic-rows.csv'): void {
  try {
    const csvContent =
      typeof data === 'string' ? data : createProblematicRowsCSV(data.rows, data.errors);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Failed to export CSV file. Please try again.');
  }
}

export function showHelpModal(content: string): void {
  // Create and show a modal with help content
  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">Help & Guidance</h2>
        <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6">
        <pre class="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">${content}</pre>
      </div>
      <div class="p-6 border-t border-gray-200">
        <button onclick="this.closest('.fixed').remove()" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}
