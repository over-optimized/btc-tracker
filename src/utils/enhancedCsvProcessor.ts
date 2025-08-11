import Papa from 'papaparse';
import { ImportError, ImportResult } from '../types/ImportError';
import { Transaction } from '../types/Transaction';
import {
  ClassificationDecision,
  ClassificationPrompt,
  TransactionClassificationResult
} from '../types/TransactionClassification';
import { validateFile } from './csvValidator';
import { detectExchangeFormat, parseAllTransactions } from './enhancedExchangeParsers';
import { TransactionClassifier } from './transactionClassifier';

export interface EnhancedProcessOptions {
  allowPartialImport?: boolean;
  skipInvalidRows?: boolean;
  maxErrors?: number;
  progressCallback?: (progress: number) => void;
}

export interface EnhancedImportResult extends ImportResult {
  needsClassification?: boolean;
  classificationPrompts?: ClassificationPrompt[];
  onClassificationComplete?: (decisions: ClassificationDecision[]) => ImportResult & { transactions: Transaction[] };
}

export class EnhancedCSVProcessor {
  private options: EnhancedProcessOptions;
  private classifier: TransactionClassifier;
  private pendingRawTransactions: Array<{ rawData: any; exchange: string }> = [];

  constructor(options: EnhancedProcessOptions = {}) {
    this.options = {
      allowPartialImport: true,
      skipInvalidRows: true,
      maxErrors: 50,
      ...options,
    };
    this.classifier = new TransactionClassifier();
  }

  async processCSVFile(file: File): Promise<EnhancedImportResult> {
    const result: EnhancedImportResult = {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      errors: [],
      warnings: [],
      summary: '',
    };

    try {
      // Step 1: File validation
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        result.errors.push(...fileValidation.errors);
        result.summary = 'File validation failed';
        return result;
      }

      // Step 2: Parse CSV
      const parseResult = await this.parseCSV(file);
      if (!parseResult.success) {
        result.errors.push(...parseResult.errors);
        result.summary = 'CSV parsing failed';
        return result;
      }

      // Step 3: Detect exchange format and parse transactions
      const exchangeType = detectExchangeFormat(parseResult.headers!);
      const rawTransactions = parseAllTransactions(parseResult.data!, exchangeType);

      if (rawTransactions.length === 0) {
        result.errors.push({
          type: 'PARSING_ERROR' as any,
          message: 'No valid transactions found in CSV file',
          details: `Detected format: ${exchangeType}`,
          recoverable: false,
        });
        result.summary = 'No transactions found';
        return result;
      }

      // Step 4: Classify transactions
      const classification = this.classifier.classifyTransactions(rawTransactions);

      // If we have transactions that need user classification
      if (classification.needsClassification.length > 0) {
        const prompts = this.classifier.generateClassificationPrompts(classification.needsClassification);

        // Store the raw data for later processing
        this.pendingRawTransactions = rawTransactions;

        result.needsClassification = true;
        result.classificationPrompts = prompts;
        result.onClassificationComplete = (decisions: ClassificationDecision[]) => {
          return this.completeClassification(classification, decisions);
        };
        result.summary = `Found ${rawTransactions.length} transactions, ${classification.needsClassification.length} need classification`;
        result.success = true; // Success, but waiting for user input

        return result;
      }

      // All transactions were auto-classified
      result.success = true;
      result.importedCount = classification.classified.length;
      result.ignoredCount = classification.skipped.length;
      result.summary = `Successfully imported ${classification.classified.length} transactions`;

      // Add classified transactions to result for immediate import
      (result as any).transactions = classification.classified;

      return result;

    } catch (error) {
      result.errors.push({
        type: 'PROCESSING_ERROR' as any,
        message: 'Unexpected error during processing',
        details: String(error),
        recoverable: false,
      });
      result.summary = 'Processing failed';
      return result;
    }
  }

  /**
   * Complete the classification process with user decisions
   */
  private completeClassification(
    initialClassification: TransactionClassificationResult,
    userDecisions: ClassificationDecision[]
  ): ImportResult & { transactions: Transaction[] } {
    const result: ImportResult & { transactions: Transaction[] } = {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      errors: [],
      warnings: [],
      summary: '',
      transactions: [],
    };

    try {
      // Start with auto-classified transactions
      const finalTransactions = [...initialClassification.classified];

      // Apply user decisions to unclassified transactions
      for (const decision of userDecisions) {
        const unclassifiedTx = initialClassification.needsClassification.find(
          tx => tx.id === decision.transactionId
        );

        if (unclassifiedTx) {
          const classifiedTx = this.classifier.applyClassification(unclassifiedTx, decision);
          if (classifiedTx) {
            finalTransactions.push(classifiedTx);
          }
        }
      }

      result.success = true;
      result.importedCount = finalTransactions.length;

      // Calculate ignored count: initially skipped + unclassified transactions
      const unclassifiedCount = Math.max(0, initialClassification.needsClassification.length - userDecisions.length);
      result.ignoredCount = initialClassification.skipped.length + unclassifiedCount;

      result.transactions = finalTransactions;
      result.summary = `Successfully imported ${finalTransactions.length} transactions`;

      return result;

    } catch (error) {
      result.errors.push({
        type: 'CLASSIFICATION_ERROR' as any,
        message: 'Error applying transaction classifications',
        details: String(error),
        recoverable: false,
      });
      result.summary = 'Classification failed';
      return result;
    }
  }

  /**
   * Parse CSV file using Papa Parse
   */
  private async parseCSV(file: File): Promise<{
    success: boolean;
    data?: any[];
    headers?: string[];
    errors: ImportError[];
  }> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            const errors: ImportError[] = results.errors.map(error => ({
              type: 'PARSING_ERROR' as any,
              message: error.message,
              details: `Row: ${error.row}, Type: ${error.type}`,
              recoverable: false,
            }));

            resolve({ success: false, errors });
            return;
          }

          resolve({
            success: true,
            data: results.data,
            headers: results.meta.fields,
            errors: [],
          });
        },
        error: (error) => {
          resolve({
            success: false,
            errors: [{
              type: 'PARSING_ERROR' as any,
              message: 'Failed to parse CSV file',
              details: error.message,
              recoverable: false,
            }],
          });
        },
      });
    });
  }
}