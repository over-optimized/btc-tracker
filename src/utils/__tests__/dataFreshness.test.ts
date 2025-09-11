import { describe, expect, it } from 'vitest';
import {
  analyzeDataFreshness,
  detectTransactionGaps,
  shouldShowImportReminder,
} from '../dataFreshness';
import { Transaction } from '../../types/Transaction';

describe('dataFreshness defensive programming', () => {
  describe('analyzeDataFreshness', () => {
    it('should handle invalid input gracefully', () => {
      // Test with null
      const result1 = analyzeDataFreshness(null as any);
      expect(result1).toEqual({
        lastTransactionDate: null,
        daysSinceLastTransaction: 0,
        isStale: false,
        staleness: 'empty',
        message: 'Loading transaction data...',
      });

      // Test with undefined
      const result2 = analyzeDataFreshness(undefined as any);
      expect(result2).toEqual({
        lastTransactionDate: null,
        daysSinceLastTransaction: 0,
        isStale: false,
        staleness: 'empty',
        message: 'Loading transaction data...',
      });

      // Test with non-array
      const result3 = analyzeDataFreshness('not an array' as any);
      expect(result3).toEqual({
        lastTransactionDate: null,
        daysSinceLastTransaction: 0,
        isStale: false,
        staleness: 'empty',
        message: 'Loading transaction data...',
      });
    });

    it('should work normally with valid empty array', () => {
      const result = analyzeDataFreshness([]);
      expect(result).toEqual({
        lastTransactionDate: null,
        daysSinceLastTransaction: 0,
        isStale: false,
        staleness: 'empty',
        message: 'No transactions imported yet',
        recommendation: 'Import your first batch of Strike transactions to get started',
      });
    });

    it('should work normally with valid transaction array', () => {
      const mockTransaction: Transaction = {
        id: 'test-1',
        date: new Date('2025-01-10'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 100,
        btcAmount: 0.001,
        price: 100000,
      };

      const result = analyzeDataFreshness([mockTransaction]);
      expect(result.lastTransactionDate).toEqual(mockTransaction.date);
      expect(result.staleness).toBeDefined();
    });
  });

  describe('detectTransactionGaps', () => {
    it('should handle invalid input gracefully', () => {
      const result1 = detectTransactionGaps(null as any);
      expect(result1).toEqual({ gaps: [], hasSignificantGaps: false });

      const result2 = detectTransactionGaps(undefined as any);
      expect(result2).toEqual({ gaps: [], hasSignificantGaps: false });

      const result3 = detectTransactionGaps('not an array' as any);
      expect(result3).toEqual({ gaps: [], hasSignificantGaps: false });
    });

    it('should work normally with valid arrays', () => {
      const result = detectTransactionGaps([]);
      expect(result).toEqual({ gaps: [], hasSignificantGaps: false });
    });
  });

  describe('shouldShowImportReminder', () => {
    it('should handle invalid input gracefully', () => {
      const result1 = shouldShowImportReminder(null as any);
      expect(result1).toBe(false);

      const result2 = shouldShowImportReminder(undefined as any);
      expect(result2).toBe(false);

      const result3 = shouldShowImportReminder('not an array' as any);
      expect(result3).toBe(false);
    });

    it('should work normally with valid arrays', () => {
      const result = shouldShowImportReminder([]);
      expect(result).toBe(false);
    });
  });
});
