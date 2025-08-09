import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';
import { ImportResult, ImportError, ImportErrorType, ErrorRecoveryContext, RecoveryOption } from '../types/ImportError';
import { validateFile, validateCSVStructure, validateTransactionRow } from './csvValidator';
import { exchangeParsers, detectExchangeFormat } from './exchangeParsers';

export interface ProcessOptions {
  allowPartialImport?: boolean;
  skipInvalidRows?: boolean;
  maxErrors?: number;
  progressCallback?: (progress: number) => void;
}

export class CSVProcessor {
  private options: ProcessOptions;
  private progressCallback?: (progress: number) => void;

  constructor(options: ProcessOptions = {}) {
    this.options = {
      allowPartialImport: true,
      skipInvalidRows: true,
      maxErrors: 50,
      ...options,
    };
    this.progressCallback = options.progressCallback;
  }

  async processCSVFile(file: File): Promise<ImportResult & { recoveryContext?: ErrorRecoveryContext }> {
    const result: ImportResult = {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      errors: [],
      warnings: [],
      summary: '',
    };

    try {
      this.updateProgress(0);

      // Step 1: File validation
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        result.errors.push(...fileValidation.errors);
        result.summary = 'File validation failed';
        return this.createFailureResult(result, file);
      }

      result.warnings.push(...fileValidation.warnings.map(w => ({
        ...w,
        type: ImportErrorType.INVALID_DATA_VALUES,
        recoverable: w.recoverable,
      })));

      this.updateProgress(10);

      // Step 2: Parse CSV
      const parseResult = await this.parseCSV(file);
      if (!parseResult.success) {
        result.errors.push(parseResult.error!);
        result.summary = 'CSV parsing failed';
        return this.createFailureResult(result, file, parseResult.data);
      }

      this.updateProgress(30);

      // Step 3: Validate CSV structure
      const { data, headers } = parseResult;
      const structureValidation = validateCSVStructure(headers, data);
      
      result.errors.push(...structureValidation.errors);
      result.warnings.push(...structureValidation.warnings.map(w => ({
        ...w,
        type: ImportErrorType.INVALID_DATA_VALUES,
        recoverable: w.recoverable,
      })));

      if (!structureValidation.isValid && !this.options.allowPartialImport) {
        result.summary = 'CSV structure validation failed';
        return this.createFailureResult(result, file, data, structureValidation.detectedFormat);
      }

      this.updateProgress(50);

      // Step 4: Process transactions
      const transactionResult = await this.processTransactions(
        data,
        structureValidation.detectedFormat,
        headers
      );

      result.importedCount = transactionResult.transactions.length;
      result.ignoredCount = transactionResult.ignoredCount;
      result.errors.push(...transactionResult.errors);

      this.updateProgress(90);

      // Step 5: Determine success
      const hasBlockingErrors = result.errors.some(error => !error.recoverable);
      
      if (hasBlockingErrors && !this.options.allowPartialImport) {
        result.success = false;
        result.summary = `Import failed: ${result.errors.length} errors found`;
        return this.createFailureResult(result, file, data, structureValidation.detectedFormat);
      }

      if (result.importedCount === 0) {
        result.success = false;
        result.summary = 'No valid transactions found';
        return this.createFailureResult(result, file, data, structureValidation.detectedFormat);
      }

      // Success!
      result.success = true;
      result.summary = this.createSuccessSummary(result);
      
      this.updateProgress(100);

      return {
        ...result,
        transactions: transactionResult.transactions,
      };

    } catch (error) {
      result.errors.push({
        type: ImportErrorType.FILE_READ_ERROR,
        message: 'Unexpected error during processing',
        details: String(error),
        suggestions: ['Try again with a different file', 'Contact support if error persists'],
        recoverable: false,
      });
      
      result.summary = 'Processing failed unexpectedly';
      return this.createFailureResult(result, file);
    }
  }

  private async parseCSV(file: File): Promise<{
    success: boolean;
    data?: any[];
    headers?: string[];
    error?: ImportError;
  }> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            const error: ImportError = {
              type: ImportErrorType.INVALID_CSV_FORMAT,
              message: 'CSV parsing failed',
              details: results.errors.map(e => e.message).join('; '),
              suggestions: [
                'Check file encoding (should be UTF-8)',
                'Ensure proper CSV formatting',
                'Try opening in Excel and re-saving as CSV',
              ],
              recoverable: false,
            };
            resolve({ success: false, error });
          } else {
            resolve({
              success: true,
              data: results.data,
              headers: results.meta.fields || [],
            });
          }
        },
        error: (error) => {
          resolve({
            success: false,
            error: {
              type: ImportErrorType.FILE_READ_ERROR,
              message: 'Failed to read CSV file',
              details: error.message,
              suggestions: ['Check if file is corrupted', 'Try a different file'],
              recoverable: false,
            },
          });
        },
      });
    });
  }

  private async processTransactions(
    data: any[],
    detectedFormat: string,
    headers: string[]
  ): Promise<{
    transactions: Transaction[];
    ignoredCount: number;
    errors: ImportError[];
  }> {
    const transactions: Transaction[] = [];
    const errors: ImportError[] = [];
    let ignoredCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Progress update for large files
        if (i % 100 === 0) {
          const progress = 50 + (i / data.length) * 40; // 50-90% range
          this.updateProgress(progress);
        }

        // Row validation
        const rowErrors = validateTransactionRow(row, detectedFormat, i);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          
          if (!this.options.skipInvalidRows || rowErrors.some(e => !e.recoverable)) {
            ignoredCount++;
            continue;
          }
        }

        // Parse transaction
        const transaction = this.parseTransaction(row, detectedFormat, i);
        
        if (transaction) {
          transactions.push(transaction);
        } else {
          ignoredCount++;
          
          if (!this.options.skipInvalidRows) {
            errors.push({
              type: ImportErrorType.INVALID_DATA_VALUES,
              message: 'Failed to parse transaction',
              details: `Row ${i + 1}: Unable to create valid transaction`,
              rowNumber: i + 1,
              suggestions: ['Check data format matches expected structure'],
              recoverable: true,
            });
          }
        }

        // Check error limits
        errorCount = errors.length;
        if (this.options.maxErrors && errorCount >= this.options.maxErrors) {
          errors.push({
            type: ImportErrorType.INVALID_DATA_VALUES,
            message: 'Too many errors encountered',
            details: `Stopped processing after ${errorCount} errors`,
            suggestions: ['Fix data issues and try again', 'Enable partial import mode'],
            recoverable: false,
          });
          break;
        }

      } catch (error) {
        errors.push({
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: `Error processing row ${i + 1}`,
          details: String(error),
          rowNumber: i + 1,
          suggestions: ['Check data format in this row'],
          recoverable: true,
        });
        
        if (!this.options.skipInvalidRows) {
          ignoredCount++;
        }
      }
    }

    return { transactions, ignoredCount, errors };
  }

  private parseTransaction(row: any, format: string, index: number): Transaction | null {
    try {
      // Try format-specific parser first
      if (format !== 'unknown' && exchangeParsers[format as keyof typeof exchangeParsers]) {
        const parser = exchangeParsers[format as keyof typeof exchangeParsers];
        const result = parser(row, index);
        if (result) return result;
      }

      // Fall back to auto-detection
      const detectedFormat = detectExchangeFormat(row);
      if (detectedFormat !== 'unknown' && exchangeParsers[detectedFormat as keyof typeof exchangeParsers]) {
        const parser = exchangeParsers[detectedFormat as keyof typeof exchangeParsers];
        return parser(row, index);
      }

      // Last resort: generic parser
      return exchangeParsers.generic(row, index);
    } catch (error) {
      return null;
    }
  }

  private createSuccessSummary(result: ImportResult): string {
    const parts = [];
    
    parts.push(`${result.importedCount} transactions imported`);
    
    if (result.ignoredCount > 0) {
      parts.push(`${result.ignoredCount} rows skipped`);
    }
    
    if (result.warnings.length > 0) {
      parts.push(`${result.warnings.length} warnings`);
    }

    if (result.errors.length > 0) {
      const recoverableErrors = result.errors.filter(e => e.recoverable).length;
      if (recoverableErrors > 0) {
        parts.push(`${recoverableErrors} minor issues`);
      }
    }

    return parts.join(', ');
  }

  private createFailureResult(
    result: ImportResult, 
    file: File, 
    data?: any[], 
    format?: string
  ): ImportResult & { recoveryContext: ErrorRecoveryContext } {
    const recoveryOptions: RecoveryOption[] = [];

    // Add retry options based on error types
    if (result.errors.some(e => e.type === ImportErrorType.MISSING_REQUIRED_COLUMNS)) {
      recoveryOptions.push({
        id: 'try-generic',
        label: 'Try Generic Format',
        description: 'Parse using generic column detection',
        action: 'retry',
        data: { forceFormat: 'generic' },
      });
    }

    if (result.errors.some(e => e.type === ImportErrorType.INVALID_DATA_VALUES && e.recoverable)) {
      recoveryOptions.push({
        id: 'skip-invalid',
        label: 'Skip Invalid Rows',
        description: 'Import only valid transactions',
        action: 'retry',
        data: { skipInvalidRows: true, allowPartialImport: true },
      });
    }

    if (data && data.length > 0) {
      recoveryOptions.push({
        id: 'export-errors',
        label: 'Export Problem Rows',
        description: 'Download CSV of rows with issues',
        action: 'export',
        data: { 
          rows: data,
          errors: result.errors.filter(e => e.rowNumber),
        },
      });
    }

    // Always offer manual review option
    recoveryOptions.push({
      id: 'manual-review',
      label: 'Review & Edit File',
      description: 'Get specific guidance on fixing your CSV',
      action: 'modify',
    });

    const recoveryContext: ErrorRecoveryContext = {
      originalFile: file,
      processedData: data,
      failedRows: result.errors.filter(e => e.rowNumber).map(e => e.rowNumber! - 1),
      detectedFormat: format,
      recoveryOptions,
    };

    return {
      ...result,
      recoveryContext,
    };
  }

  private updateProgress(progress: number): void {
    if (this.progressCallback) {
      this.progressCallback(Math.min(100, Math.max(0, progress)));
    }
  }
}

export async function processCSVFile(file: File, options?: ProcessOptions): Promise<ImportResult & { recoveryContext?: ErrorRecoveryContext }> {
  const processor = new CSVProcessor(options);
  return processor.processCSVFile(file);
}