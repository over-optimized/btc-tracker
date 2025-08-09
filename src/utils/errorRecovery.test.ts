import { describe, expect, it } from 'vitest';
import {
  generateRecoveryOptions,
  createProblematicRowsCSV,
  generateHelpContent,
} from './errorRecovery';
import { ImportError, ImportErrorType } from '../types/ImportError';

describe('errorRecovery', () => {
  describe('generateRecoveryOptions', () => {
    it('should generate format-related recovery options', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.MISSING_REQUIRED_COLUMNS,
          message: 'Missing columns',
          recoverable: true,
          suggestions: [],
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {
        detectedFormat: 'coinbase',
        rowCount: 10,
      });
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'try-generic-format')).toBe(true);
      expect(options.some(opt => opt.id === 'force-format')).toBe(true);
    });

    it('should generate skip invalid rows option for recoverable errors', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Invalid value',
          recoverable: true,
          suggestions: [],
        },
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Another invalid value',
          recoverable: true,
          suggestions: [],
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {});
      
      expect(options.some(opt => opt.id === 'skip-invalid-rows')).toBe(true);
      const skipOption = options.find(opt => opt.id === 'skip-invalid-rows');
      expect(skipOption?.description).toContain('2 problematic rows');
    });

    it('should generate export problematic rows option', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Invalid data',
          recoverable: false,
          suggestions: [],
          rowNumber: 1,
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {
        processedData: [{ id: 1, data: 'test' }],
      });
      
      expect(options.some(opt => opt.id === 'export-problematic-rows')).toBe(true);
    });

    it('should generate CSV format help for format errors', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_CSV_FORMAT,
          message: 'Invalid CSV',
          recoverable: false,
          suggestions: [],
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {});
      
      expect(options.some(opt => opt.id === 'csv-help')).toBe(true);
    });

    it('should generate export help for empty files', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.EMPTY_FILE,
          message: 'Empty file',
          recoverable: false,
          suggestions: [],
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {
        detectedFormat: 'strike',
      });
      
      expect(options.some(opt => opt.id === 'export-help')).toBe(true);
      const exportOption = options.find(opt => opt.id === 'export-help');
      expect(exportOption?.data?.exchange).toBe('strike');
    });

    it('should generate batch processing option for large files', () => {
      const options = generateRecoveryOptions([], [], {
        fileSize: 10 * 1024 * 1024, // 10MB
      });
      
      expect(options.some(opt => opt.id === 'batch-import')).toBe(true);
    });

    it('should always generate manual review option when errors exist', () => {
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Some error',
          recoverable: true,
          suggestions: ['Fix this'],
        }
      ];
      
      const options = generateRecoveryOptions(errors, [], {});
      
      expect(options.some(opt => opt.id === 'manual-review')).toBe(true);
      const manualOption = options.find(opt => opt.id === 'manual-review');
      expect(manualOption?.data?.specificErrors).toBeDefined();
    });

    it('should not generate options when no errors exist', () => {
      const options = generateRecoveryOptions([], [], {});
      
      expect(options.length).toBe(0);
    });

    it('should limit specific errors in manual review', () => {
      const errors: ImportError[] = Array(10).fill(null).map((_, i) => ({
        type: ImportErrorType.INVALID_DATA_VALUES,
        message: `Error ${i}`,
        recoverable: true,
        suggestions: [`Suggestion ${i}`],
      }));
      
      const options = generateRecoveryOptions(errors, [], {});
      
      const manualOption = options.find(opt => opt.id === 'manual-review');
      expect(manualOption?.data?.specificErrors).toHaveLength(5); // Should limit to 5
    });
  });

  describe('createProblematicRowsCSV', () => {
    it('should create CSV with error information', () => {
      const originalData = [
        { name: 'John', amount: '100' },
        { name: 'Jane', amount: 'invalid' },
        { name: 'Bob', amount: '200' },
      ];
      
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Invalid amount',
          rowNumber: 2,
          suggestions: ['Use numeric values'],
          recoverable: false,
        }
      ];
      
      const csv = createProblematicRowsCSV(originalData, errors);
      
      expect(csv).toContain('name,amount,__ERROR_DETAILS__,__SUGGESTIONS__');
      expect(csv).toContain('Jane,invalid');
      expect(csv).toContain('Invalid amount');
      expect(csv).toContain('Use numeric values');
    });

    it('should handle empty data', () => {
      const csv = createProblematicRowsCSV([], []);
      
      expect(csv).toBe('No data available');
    });

    it('should handle no problematic rows', () => {
      const originalData = [{ name: 'John', amount: '100' }];
      const errors: ImportError[] = [];
      
      const csv = createProblematicRowsCSV(originalData, errors);
      
      expect(csv).toBe('No problematic rows found');
    });

    it('should escape CSV special characters', () => {
      const originalData = [
        { name: 'John "The Trader"', amount: '1,000' },
      ];
      
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Amount contains commas',
          rowNumber: 1,
          suggestions: [],
          recoverable: false,
        }
      ];
      
      const csv = createProblematicRowsCSV(originalData, errors);
      
      expect(csv).toContain('"John ""The Trader"""'); // Escaped quotes
      expect(csv).toContain('"1,000"'); // Quoted due to comma
    });

    it('should combine multiple errors for same row', () => {
      const originalData = [
        { name: '', amount: 'invalid' },
      ];
      
      const errors: ImportError[] = [
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Missing name',
          rowNumber: 1,
          suggestions: ['Provide name'],
          recoverable: false,
        },
        {
          type: ImportErrorType.INVALID_DATA_VALUES,
          message: 'Invalid amount',
          rowNumber: 1,
          suggestions: ['Use numbers'],
          recoverable: false,
        }
      ];
      
      const csv = createProblematicRowsCSV(originalData, errors);
      
      expect(csv).toContain('Missing name; Invalid amount');
      expect(csv).toContain('Provide name; Use numbers');
    });
  });

  describe('generateHelpContent', () => {
    it('should generate CSV format help', () => {
      const help = generateHelpContent('csv-format');
      
      expect(help).toContain('CSV Format Help');
      expect(help).toContain('File Encoding');
      expect(help).toContain('Column Headers');
      expect(help).toContain('Date Format');
      expect(help).toContain('Number Format');
      expect(help).toContain('Quick Fixes');
    });

    it('should generate export guide', () => {
      const help = generateHelpContent('export-guide', { exchange: 'Strike' });
      
      expect(help).toContain('Export Guide for Strike');
      expect(help).toContain('General Steps');
      expect(help).toContain('What to Include');
      expect(help).toContain('Common Export Issues');
    });

    it('should generate export guide with default exchange', () => {
      const help = generateHelpContent('export-guide');
      
      expect(help).toContain('Export Guide for your exchange');
    });

    it('should generate manual review guide', () => {
      const errors = [
        {
          message: 'Invalid amount',
          suggestions: ['Use numbers', 'Check format'],
        },
        {
          message: 'Missing date',
          suggestions: ['Add date column'],
        }
      ];
      
      const help = generateHelpContent('manual-review', { specificErrors: errors });
      
      expect(help).toContain('Manual Review Guide');
      expect(help).toContain('1. Invalid amount');
      expect(help).toContain('- Use numbers');
      expect(help).toContain('- Check format');
      expect(help).toContain('2. Missing date');
      expect(help).toContain('- Add date column');
      expect(help).toContain('General Tips');
      expect(help).toContain('Still Need Help?');
    });

    it('should generate manual review guide with no errors', () => {
      const help = generateHelpContent('manual-review', { specificErrors: [] });
      
      expect(help).toContain('Manual Review Guide');
      expect(help).toContain('General Tips');
    });

    it('should handle unknown help types', () => {
      const help = generateHelpContent('unknown-type');
      
      expect(help).toBe('Help content not available for this topic.');
    });

    it('should handle missing context', () => {
      const help = generateHelpContent('manual-review');
      
      expect(help).toContain('Manual Review Guide');
      expect(help).toContain('General Tips');
    });
  });
});