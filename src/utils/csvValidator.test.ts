import { describe, expect, it } from 'vitest';
import {
  validateFile,
  validateCSVStructure,
  validateTransactionRow,
  generateErrorSuggestions,
} from './csvValidator';
import { ImportErrorType } from '../types/ImportError';

describe('csvValidator', () => {
  describe('validateFile', () => {
    it('should validate CSV files correctly', () => {
      const validFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileSize).toBe(validFile.size);
    });

    it('should reject files that are too large', () => {
      const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const result = validateFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(ImportErrorType.FILE_READ_ERROR);
      expect(result.errors[0].message).toContain('File size too large');
    });

    it('should reject non-CSV files', () => {
      const txtFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(txtFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(ImportErrorType.INVALID_CSV_FORMAT);
      expect(result.errors[0].message).toContain('Invalid file type');
    });

    it('should warn about very small files', () => {
      const smallFile = new File(['a'], 'tiny.csv', { type: 'text/csv' });
      const result = validateFile(smallFile);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('SUSPICIOUS_DATA');
      expect(result.warnings[0].message).toContain('very small');
    });
  });

  describe('validateCSVStructure', () => {
    it('should detect Strike format correctly', () => {
      const headers = ['Reference', 'Date & Time (UTC)', 'Transaction Type', 'Amount USD', 'Amount BTC'];
      const data = [{ 'Reference': 'abc123', 'Transaction Type': 'Purchase' }];
      
      const result = validateCSVStructure(headers, data);
      
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('strike');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect Coinbase format correctly', () => {
      const headers = ['Transaction Type', 'Timestamp', 'Quantity Transacted'];
      const data = [{ 'Transaction Type': 'Buy', 'Timestamp': '2025-01-01' }];
      
      const result = validateCSVStructure(headers, data);
      
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('coinbase');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect Kraken format correctly', () => {
      const headers = ['type', 'pair', 'time', 'cost', 'vol'];
      const data = [{ 'type': 'trade', 'pair': 'XBTUSD' }];
      
      const result = validateCSVStructure(headers, data);
      
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('kraken');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing required columns', () => {
      const headers = ['Date & Time (UTC)', 'Transaction Type']; // Missing Reference and amounts
      const data = [{ 'Transaction Type': 'Purchase' }];
      
      const result = validateCSVStructure(headers, data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(ImportErrorType.MISSING_REQUIRED_COLUMNS);
      expect(result.errors[0].message).toContain('Missing required columns');
    });

    it('should handle empty data', () => {
      const headers = ['Date', 'Amount'];
      const data: any[] = [];
      
      const result = validateCSVStructure(headers, data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some(e => e.type === ImportErrorType.EMPTY_FILE)).toBe(true);
      expect(result.errors.some(e => e.message.includes('no data rows'))).toBe(true);
    });

    it('should warn about large datasets', () => {
      const headers = ['Date', 'Amount'];
      const data = Array(1500).fill({ Date: '2025-01-01', Amount: '100' });
      
      const result = validateCSVStructure(headers, data);
      
      // May have validation errors but warnings should still be present
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.type === 'SUSPICIOUS_DATA')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Large number of transactions'))).toBe(true);
    });

    it('should warn about duplicate headers', () => {
      const headers = ['Date', 'Amount', 'Date']; // Duplicate Date
      const data = [{ Date: '2025-01-01', Amount: '100' }];
      
      const result = validateCSVStructure(headers, data);
      
      // May have other validation issues, but should detect duplicate headers
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.type === 'FORMAT_INCONSISTENCY')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Duplicate column headers'))).toBe(true);
    });
  });

  describe('validateTransactionRow', () => {
    it('should validate Strike rows correctly', () => {
      const validRow = {
        'Reference': 'abc123',
        'Date & Time (UTC)': 'Jan 01 2025 14:36:06',
        'Transaction Type': 'Purchase',
        'Amount USD': '100.00',
        'Amount BTC': '0.001'
      };
      
      const errors = validateTransactionRow(validRow, 'strike', 0);
      
      expect(errors).toHaveLength(0);
    });

    it('should reject Strike rows with invalid transaction type', () => {
      const invalidRow = {
        'Reference': 'abc123',
        'Date & Time (UTC)': 'Jan 01 2025 14:36:06',
        'Transaction Type': 'Sell', // Invalid for Strike
        'Amount USD': '100.00',
        'Amount BTC': '0.001'
      };
      
      const errors = validateTransactionRow(invalidRow, 'strike', 0);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Unsupported transaction type');
    });

    it('should validate Coinbase rows correctly', () => {
      const validRow = {
        'Transaction Type': 'Buy',
        'Timestamp': '2025-01-01T12:00:00Z',
        'Quantity Transacted': '0.001',
        'USD Spot Price at Transaction': '95000.00'
      };
      
      const errors = validateTransactionRow(validRow, 'coinbase', 0);
      
      expect(errors).toHaveLength(0);
    });

    it('should validate Kraken rows correctly', () => {
      const validRow = {
        'type': 'trade',
        'pair': 'XBTUSD',
        'time': '2025-01-01 12:00:00',
        'cost': '95.00',
        'vol': '0.001'
      };
      
      const errors = validateTransactionRow(validRow, 'kraken', 0);
      
      expect(errors).toHaveLength(0);
    });

    it('should reject Kraken rows with non-Bitcoin pairs', () => {
      const invalidRow = {
        'type': 'trade',
        'pair': 'ETHUSD', // Not Bitcoin
        'time': '2025-01-01 12:00:00',
        'cost': '95.00',
        'vol': '0.001'
      };
      
      const errors = validateTransactionRow(invalidRow, 'kraken', 0);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Non-Bitcoin trading pair');
    });

    it('should handle missing required fields', () => {
      const invalidRow = {
        'Transaction Type': 'Purchase',
        // Missing other required fields
      };
      
      const errors = validateTransactionRow(invalidRow, 'strike', 0);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Missing required field');
    });

    it('should validate amounts correctly', () => {
      const invalidRow = {
        'Date': '2025-01-01',
        'USD Amount': 'invalid-amount', // Invalid number
        'BTC Amount': '0.001'
      };
      
      const errors = validateTransactionRow(invalidRow, 'generic', 0);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Invalid amount value');
    });

    it('should validate dates correctly', () => {
      const invalidRow = {
        'Date': 'not-a-date',
        'USD Amount': '100.00',
        'BTC Amount': '0.001'
      };
      
      const errors = validateTransactionRow(invalidRow, 'generic', 0);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Invalid date format');
    });

    it('should warn about future dates', () => {
      const futureRow = {
        'Date': '2030-01-01', // Future date
        'USD Amount': '100.00',
        'BTC Amount': '0.001'
      };
      
      const errors = validateTransactionRow(futureRow, 'generic', 0);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
      expect(errors[0].message).toContain('Future date detected');
      expect(errors[0].recoverable).toBe(true);
    });

    it('should handle null or invalid row data', () => {
      const errors1 = validateTransactionRow(null, 'generic', 0);
      const errors2 = validateTransactionRow(undefined, 'generic', 0);
      const errors3 = validateTransactionRow('invalid', 'generic', 0);
      
      expect(errors1).toHaveLength(1);
      expect(errors2).toHaveLength(1);
      expect(errors3).toHaveLength(1);
      
      [errors1, errors2, errors3].forEach(errors => {
        expect(errors[0].type).toBe(ImportErrorType.INVALID_DATA_VALUES);
        expect(errors[0].message).toContain('Invalid row data');
      });
    });
  });

  describe('generateErrorSuggestions', () => {
    it('should generate suggestions for missing required columns', () => {
      const error = {
        type: ImportErrorType.MISSING_REQUIRED_COLUMNS,
        message: 'Missing columns',
        suggestions: ['Check export format'],
        recoverable: true,
      };
      
      const suggestions = generateErrorSuggestions(error);
      
      expect(suggestions.length).toBeGreaterThan(1);
      expect(suggestions).toContain('Check export format');
      expect(suggestions.some(s => s.includes('Generic format'))).toBe(true);
    });

    it('should generate suggestions for invalid CSV format', () => {
      const error = {
        type: ImportErrorType.INVALID_CSV_FORMAT,
        message: 'Invalid format',
        suggestions: [],
        recoverable: true,
      };
      
      const suggestions = generateErrorSuggestions(error);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('CSV format'))).toBe(true);
    });

    it('should generate suggestions for empty files', () => {
      const error = {
        type: ImportErrorType.EMPTY_FILE,
        message: 'No data',
        suggestions: [],
        recoverable: false,
      };
      
      const suggestions = generateErrorSuggestions(error);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('date range'))).toBe(true);
    });

    it('should always include contact support suggestion', () => {
      const error = {
        type: ImportErrorType.NETWORK_ERROR,
        message: 'Network error',
        suggestions: [],
        recoverable: false,
      };
      
      const suggestions = generateErrorSuggestions(error);
      
      expect(suggestions.some(s => s.includes('Contact support'))).toBe(true);
    });

    it('should preserve existing suggestions', () => {
      const error = {
        type: ImportErrorType.INVALID_DATA_VALUES,
        message: 'Invalid data',
        suggestions: ['Original suggestion'],
        recoverable: true,
      };
      
      const suggestions = generateErrorSuggestions(error);
      
      expect(suggestions).toContain('Original suggestion');
    });
  });
});